import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Staffer } from './entities/staff.entity';
import { StaffRole } from './entities/enum';
import { FindOptionsWhere, In, IsNull, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { VerifyPhoneCodeDto } from 'src/modules/auth/dto/verify-code.dto';
import { SendPhoneCodeDto } from 'src/modules/auth/dto/send-code.dto';
import {
  StaffInvitation,
  StaffInvitationStatus,
} from './entities/staff-invitation.entity';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import {
  CreateStaffInvitationDto,
  UpdateStaffRoleDto,
} from './dto/staff-invitation.dto';
import { ConfigService } from '@nestjs/config';
import { dayjs } from '../shared/dayjs';
import { EmailSignupDto } from '../auth/dto/signup.dto';
import { EmailService, EmailTemplate } from '../shared/services/email.service';
import { TenantsService } from '../tenants/tenants.service';
import {
  INVALID_INVITATION,
  STAFF_NOT_FOUND,
  CANNOT_MODIFY_OWNER_ROLE,
  PHONE_NUMBER_MUST_BE_DIFFERENT,
  STAFF_EMAIL_ALREADY_EXISTS,
  FORBIDDEN,
  INVITATION_NOT_FOUND_OR_USED,
  INCORRECT_CURRENT_PASSWORD,
  NEW_PASSWORD_SAME_AS_CURRENT,
  EMAIL_MUST_BE_DIFFERENT,
  NO_PENDING_EMAIL_CHANGE,
  INVALID_CREDENTIALS,
  BRANCH_NOT_FOUND,
  CANNOT_ASSIGN_OWNER_TO_BRANCH,
  CANNOT_ASSIGN_SELF,
  CANNOT_MODIFY_LAST_SUPER_ADMIN,
  CANNOT_PROMOTE_TO_SUPER_ADMIN,
  ROLE_REQUIRED,
  OWNER_CANNOT_DELETE_ACCOUNT,
} from '../shared/error-codes';
import { sanitizeStaff, sanitizeStaffInvitation } from './util';
import { ListStaffResponseDto } from './dto/list-staff-response.dto';
import { ListStaffDto } from './dto/list-staff.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { VerificationService } from '../auth/verification.service';
import { UserType } from '../auth/@types/user.type';
import {
  VerificationChannel,
  VerificationContext,
} from '../auth/entities/verification.entity';
import { RequestAccountDeletionDto, VerifyAccountDeletionDto } from './dto/delete-account.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StaffEvent } from './staff.events';
import { hashPassword, verifyPassword } from '../auth/util/password';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  RequestEmailChangeDto,
  VerifyEmailChangeDto,
} from './dto/change-email.dto';
import { BranchStaffer } from './entities/branch-staffer.entity';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { BranchesService } from '../branches/branches.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staffer)
    private readonly staffRepository: Repository<Staffer>,
    @InjectRepository(StaffInvitation)
    private readonly staffInvitationRepository: Repository<StaffInvitation>,
    @InjectRepository(BranchStaffer)
    private readonly branchStafferRepository: Repository<BranchStaffer>,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly tenantsService: TenantsService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly verificationService: VerificationService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async getById(id: string) {
    return this.staffRepository.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async getByEmail(email: string) {
    return this.staffRepository.findOne({ where: { email, deletedAt: IsNull() } });
  }

  async exists(where: FindOptionsWhere<Staffer> | FindOptionsWhere<Staffer>[]) {
    return this.staffRepository.exists({ where });
  }

  async update(id: string, data: Partial<Staffer>) {
    const staff = await this.getById(id);
    if (!staff) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }
    const updatedStaff = { ...staff, ...data };
    await this.cacheManager.del(`staff#${staff.tenantId}`);
    return this.staffRepository.save(updatedStaff);
  }

  @Transactional()
  async verifyInvitationToken(
    token: string | undefined,
    email: string,
  ): Promise<StaffInvitation | null> {
    if (!token) {
      return null;
    }

    const hashedToken = createHash('sha256').update(token).digest('hex');
    const invitation = await this.staffInvitationRepository.findOne({
      where: {
        token: hashedToken,
        status: StaffInvitationStatus.PENDING,
        email,
      },
    });

    if (
      !invitation ||
      invitation.email !== email ||
      dayjs(invitation.expires).isBefore(dayjs())
    ) {
      throw new NotFoundException(INVALID_INVITATION);
    }

    return invitation;
  }
  @Transactional()
  async create(data: EmailSignupDto) {
    const { email, password, token, firstName, lastName } = data;

    const invitation = await this.verifyInvitationToken(token, email);

    const staffer = await this.staffRepository.save({
      email,
      password,
      firstName,
      lastName,
      tenantId: invitation?.tenantId,
      role: invitation?.role || StaffRole.OWNER,
      verifiedAt: invitation ? new Date() : null,
    });

    if (invitation) {
      await this.staffInvitationRepository.update(
        { id: invitation.id },
        { status: StaffInvitationStatus.ACCEPTED },
      );

      if (invitation.branchId && invitation.role !== StaffRole.SUPER_ADMIN) {
        await this.branchStafferRepository.save({
          branchId: invitation.branchId,
          stafferId: staffer.id,
        });

        await Promise.all([
          this.cacheManager.del(`staff#${staffer.tenantId}_${invitation.branchId}`),
          this.cacheManager.del(`staff#${invitation.tenantId}`),
        ]);
      }
    } else {
      const tenant = await this.tenantsService.create({
        ownerId: staffer.id,
        profileCompletion: {
          name: false,
          logo: false,
          phoneNumber: false,
          branches: false,
          courts: false,
        },
      });

      await this.staffRepository.update(staffer.id, {
        tenantId: tenant.id,
      });
      staffer.tenantId = tenant.id;
    }

    if (staffer.tenantId) {
      await this.cacheManager.del(`staff#${staffer.tenantId}`);
    }

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(StaffEvent.STAFF_CREATED, {
        staff: staffer,
      });
    });

    return staffer;
  }

  @Transactional()
  async updateStaffRole(
    staffId: string,
    { role }: UpdateStaffRoleDto,
    currentUser: SessionUser,
  ) {
    const staff = await this.getById(staffId);
    if (!staff) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }
    if (staff.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(FORBIDDEN);
    }
    if (staff.role === StaffRole.OWNER) {
      throw new ForbiddenException(CANNOT_MODIFY_OWNER_ROLE);
    }
    if (role === StaffRole.SUPER_ADMIN || role === StaffRole.OWNER) {
      throw new BadRequestException(CANNOT_PROMOTE_TO_SUPER_ADMIN);
    }

    await this.staffRepository.update(staffId, { role });
    await this.cacheManager.del(`staff#${staff.tenantId}`);
  }

  async sendUpdatePhoneNumberVerification(
    { phoneNumber }: SendPhoneCodeDto,
    { id: userId }: SessionUser,
    ip: string,
  ) {
    const user = await this.getById(userId);
    if (!user) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }
    await this.verificationService.sendPhoneCode(phoneNumber, ip);
  }

  async verifyPhoneNumber(
    { phoneNumber, code }: VerifyPhoneCodeDto,
    currentUser: SessionUser,
  ) {
    const user = await this.getById(currentUser.id);
    if (!user) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    if (user.phoneNumber === phoneNumber) {
      throw new BadRequestException(PHONE_NUMBER_MUST_BE_DIFFERENT);
    }

    const { isValid, errorCode } = await this.verificationService.verifyCode({
      code,
      userType: UserType.Staff,
      identifier: phoneNumber,
      channel: VerificationChannel.PHONE,
    });
    if (!isValid) {
      throw new BadRequestException(errorCode);
    }
    return this.update(currentUser.id, {
      phoneNumber,
    });
  }

  async generateInviteLink(
    data: CreateStaffInvitationDto,
    currentUser: SessionUser,
  ) {
    const superAdmins = currentUser.role === StaffRole.SUPER_ADMIN;
    const { email, role, branchId } = (data as CreateStaffInvitationDto) ?? {};
    const tenantId = superAdmins ? null : currentUser.tenantId;

    if (!superAdmins && !role) {
      throw new BadRequestException(ROLE_REQUIRED);
    }

    if (!superAdmins && role === StaffRole.SUPER_ADMIN) {
      throw new BadRequestException(CANNOT_PROMOTE_TO_SUPER_ADMIN);
    }

    const existingStaff = await this.getByEmail(email);
    if (existingStaff) {
      throw new BadRequestException(STAFF_EMAIL_ALREADY_EXISTS);
    }

    if (branchId && tenantId) {
      const branch = await this.branchesService.findOne(branchId);
      if (!branch) {
        throw new NotFoundException(BRANCH_NOT_FOUND);
      }
      if (branch.tenantId !== tenantId) {
        throw new ForbiddenException(FORBIDDEN);
      }
    }

    const existingInvitation = await this.staffInvitationRepository.findOne({
      where: {
        email,
        tenantId: superAdmins ? IsNull() : tenantId,
        status: StaffInvitationStatus.PENDING,
      },
    });
    if (existingInvitation) {
      await this.staffInvitationRepository.delete(existingInvitation.id);
    }

    const token = nanoid(32);
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const expires = dayjs().add(7, 'days').toDate();
    await this.staffInvitationRepository.save({
      email,
      role,
      token: hashedToken,
      expires,
      tenantId,
      status: StaffInvitationStatus.PENDING,
      branchId,
    });

    const baseUrl = this.configService.get<string>('FRONTEND_URL');
    const invitationLink = `${baseUrl}/auth/signup?token=${token}`;
    const tenantName = superAdmins
      ? this.configService.get<string>('APP_NAME')
      : (await this.tenantsService.getTenant(tenantId)).name;

    await this.emailService.sendEmail({
      to: [email],
      template: EmailTemplate.STAFF_INVITATION,
      data: {
        invitationLink,
        tenantName,
      },
    });
  }

  async listStaff(
    currentUser: SessionUser,
    { page, pageSize, search, role, branchId }: ListStaffDto = {},
  ): Promise<ListStaffResponseDto> {
    const where: FindOptionsWhere<Staffer> = {
      tenantId: currentUser.tenantId,
      deletedAt: IsNull(),
    };
    if (search) {
      where.email = Like(`%${search}%`);
    }
    if (role) {
      where.role = role;
    }

    if (branchId) {
      where.branches = { branchId };
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const [staff, total] = await this.staffRepository.findAndCount({
      where,
      skip,
      take,
    });

    return {
      items: staff.map(sanitizeStaff),
      pagination: {
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getSuperAdmins() {
    return this.staffRepository.find({
      where: { role: StaffRole.SUPER_ADMIN, deletedAt: IsNull() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  async listSuperAdmins({
    page = 1,
    pageSize = 10,
  }: { page?: number; pageSize?: number } = {}) {
    const [admins, total] = await this.staffRepository.findAndCount({
      where: { role: StaffRole.SUPER_ADMIN, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: admins.map(sanitizeStaff),
      pagination: {
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async createSuperAdmin({
    firstName,
    lastName,
    email,
    password,
  }: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    const existingStaff = await this.getByEmail(email);
    if (existingStaff) {
      throw new BadRequestException(STAFF_EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await hashPassword(password);

    const staffer = await this.staffRepository.save({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: StaffRole.SUPER_ADMIN,
      tenantId: null,
      verifiedAt: new Date(),
      lastPasswordChangeAt: new Date(),
    });

    return sanitizeStaff(staffer);
  }

  private async assertNotLastSuperAdmin(staff: Staffer) {
    if (staff.role !== StaffRole.SUPER_ADMIN) {
      return;
    }
    const superAdminCount = await this.staffRepository.count({
      where: { role: StaffRole.SUPER_ADMIN, deletedAt: IsNull() },
    });
    if (superAdminCount <= 1) {
      throw new BadRequestException(CANNOT_MODIFY_LAST_SUPER_ADMIN);
    }
  }

  async deactivateSuperAdmin(id: string) {
    const staff = await this.getById(id);
    if (!staff || staff.role !== StaffRole.SUPER_ADMIN) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    await this.assertNotLastSuperAdmin(staff);

    await this.staffRepository.update(id, { deletedAt: new Date() });
  }

  async updateSuperAdminRole(id: string, role: StaffRole) {
    const staff = await this.getById(id);
    if (!staff) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    if (staff.role === StaffRole.SUPER_ADMIN && role !== StaffRole.SUPER_ADMIN) {
      await this.assertNotLastSuperAdmin(staff);
    }

    await this.staffRepository.update(id, { role });

    return sanitizeStaff({ ...staff, role });
  }

  async getStaff({
    tenantId,
    branchId,
  }: {
    tenantId?: string;
    branchId?: string;
  }) {    let staff: Staffer[] = [];

    if (!tenantId && !branchId) {
      throw new Error("Tenant or branch is required");
    }


    const cacheKey = `staff#${tenantId ?? ""}${branchId ? `_${branchId}` : ""}`;
    const cachedStaff = await this.cacheManager.get<Staffer[]>(cacheKey);
    if (cachedStaff) {
      return cachedStaff;
    }

    if (branchId) {
      const branchStaffers = await this.branchStafferRepository.find({
        where: { branch: { id: branchId }, staffer: { deletedAt: IsNull() } },
        relations: {
          staffer: true,
        },
        select: {
          staffer: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      });
      staff = branchStaffers.map((branchStaffer) => branchStaffer.staffer);

      // Branch links are not guaranteed to exist for every staffer (e.g.
      // owner created at tenant level). When a tenantId is also provided,
      // union with tenant-level staff so nobody is missed.
      if (tenantId) {
        const tenantStaff = await this.staffRepository.find({
          where: { tenantId, deletedAt: IsNull() },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        });
        const seen = new Set(staff.map((staffer) => staffer.id));
        staff.push(...tenantStaff.filter((staffer) => !seen.has(staffer.id)));
      }
    } else if (tenantId) {
      staff = await this.staffRepository.find({
        where: { tenantId, deletedAt: IsNull() },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
    }

    if (staff.length > 0) {
      await this.cacheManager.set(cacheKey, staff, 300);
    }

    return staff;
  }

  async listInvitations(user?: SessionUser) {
    const superAdmins = user.role === StaffRole.SUPER_ADMIN;

    if (!superAdmins && user.role !== StaffRole.OWNER) {
      throw new ForbiddenException(FORBIDDEN);
    }

    const invitations = await this.staffInvitationRepository.find({
      where: {
        tenantId: superAdmins ? IsNull() : user.tenantId,
        status: StaffInvitationStatus.PENDING,
        ...(superAdmins && { role: StaffRole.SUPER_ADMIN }),
      },
      order: { createdAt: 'DESC' },
    });
    return invitations.map(sanitizeStaffInvitation);
  }

  async revokeInvitation(invitationId: string, user?: SessionUser) {
    const superAdmins = user.role === StaffRole.SUPER_ADMIN;

    if (!superAdmins && user.role !== StaffRole.OWNER) {
      throw new ForbiddenException(FORBIDDEN);
    }

    const invitation = await this.staffInvitationRepository.findOne({
      where: {
        id: invitationId,
        tenantId: superAdmins ? IsNull() : user.tenantId,
        status: StaffInvitationStatus.PENDING,
        ...(superAdmins && { role: StaffRole.SUPER_ADMIN }),
      },
    });

    if (!invitation) {
      throw new NotFoundException(
        INVITATION_NOT_FOUND_OR_USED,
      );
    }

    await this.staffInvitationRepository.delete(invitationId);
  }

  async changePassword(
    userId: string,
    { currentPassword, newPassword }: ChangePasswordDto,
  ) {
    const staff = await this.getById(userId);
    if (!staff) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }
    const isPasswordValid = await verifyPassword({
      hash: staff.password,
      password: currentPassword,
    });

    if (!isPasswordValid) {
      throw new BadRequestException(INCORRECT_CURRENT_PASSWORD);
    }

    const isSamePassword = await verifyPassword({
      hash: staff.password,
      password: newPassword,
    });

    if (isSamePassword) {
      throw new BadRequestException(NEW_PASSWORD_SAME_AS_CURRENT);
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.update(userId, {
      password: hashedPassword,
      lastPasswordChangeAt: new Date(),
    });
  }

  async requestEmailChange(
    { email, password }: RequestEmailChangeDto,
    currentUser: SessionUser,
  ) {
    const userId = currentUser.id;
    const staff = await this.getById(userId);
    if (!staff) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    const isPasswordValid = await verifyPassword({
      hash: staff.password,
      password,
    });

    if (!isPasswordValid) {
      throw new BadRequestException(INVALID_CREDENTIALS);
    }
    if (staff.email === email) {
      throw new BadRequestException(EMAIL_MUST_BE_DIFFERENT);
    }

    const existingStaff = await this.getByEmail(email);
    if (existingStaff && existingStaff.id !== userId) {
      throw new BadRequestException(STAFF_EMAIL_ALREADY_EXISTS);
    }

    await this.update(userId, { pendingEmail: email });

    const tempStaff = { ...staff, email };
    await this.verificationService.sendVerificationEmail(
      tempStaff as Staffer,
      VerificationContext.EMAIL_VERIFICATION,
    );
  }

  async verifyEmailChange(
    { code }: VerifyEmailChangeDto,
    currentUser: SessionUser,
  ) {
    const userId = currentUser.id;
    const staff = await this.getById(userId);
    if (!staff) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    if (!staff.pendingEmail) {
      throw new BadRequestException(NO_PENDING_EMAIL_CHANGE);
    }

    const { isValid, errorCode } = await this.verificationService.verifyCode({
      code,
      userType: UserType.Staff,
      identifier: staff.pendingEmail,
      channel: VerificationChannel.EMAIL,
      context: VerificationContext.EMAIL_VERIFICATION,
    });

    if (!isValid) {
      throw new BadRequestException(errorCode);
    }

    await this.update(userId, {
      email: staff.pendingEmail,
      pendingEmail: null,
    });

    await this.verificationService.delete({
      userId,
      context: VerificationContext.EMAIL_VERIFICATION,
    });

    await this.cacheManager.del(`staff#${staff.tenantId}`);
  }

  async cancelEmailChange(currentUser: SessionUser) {
    const userId = currentUser.id;
    const staff = await this.getById(userId);
    if (!staff) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    if (!staff.pendingEmail) {
      throw new BadRequestException(NO_PENDING_EMAIL_CHANGE);
    }

    await this.update(userId, { pendingEmail: null });

    await this.verificationService.delete({
      userId,
      context: VerificationContext.EMAIL_VERIFICATION,
    });
  }

  @Transactional()
  async assignStaffToBranch(
    staffIds: string[],
    branchId: string,
    currentUser: SessionUser,
  ) {
    if (staffIds.includes(currentUser.id)) {
      throw new BadRequestException(CANNOT_ASSIGN_SELF);
    }

    const staffMembers = await this.staffRepository.find({
      where: { id: In(staffIds), tenantId: currentUser.tenantId, deletedAt: IsNull() },
    });

    if (staffMembers.length !== staffIds.length) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    const owners = staffMembers.filter((s) => s.role === StaffRole.OWNER);
    if (owners.length > 0) {
      throw new BadRequestException(CANNOT_ASSIGN_OWNER_TO_BRANCH);
    }

    const branch = await this.branchesService.findOne(branchId);

    if (!branch) {
      throw new NotFoundException(BRANCH_NOT_FOUND);
    }

    if (branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(FORBIDDEN);
    }

    const existingAssignments = await this.branchStafferRepository.find({
      where: { branchId, stafferId: In(staffIds) },
    });

    const alreadyAssignedIds = existingAssignments.map((a) => a.stafferId);
    const newStaffIds = staffIds.filter((id) => !alreadyAssignedIds.includes(id));

    if (newStaffIds.length > 0) {
      await this.branchStafferRepository.save(
        newStaffIds.map((stafferId) => ({ branchId, stafferId })),
      );

      await Promise.all([
        this.cacheManager.del(`staff#${currentUser.tenantId}`),
        this.cacheManager.del(`staff#${currentUser.tenantId}_${branchId}`),
      ]);
    }
  }

  @Transactional()
  async unassignStaffFromBranch(
    staffIds: string[],
    branchId: string,
    currentUser: SessionUser,
  ) {
    const branch = await this.branchesService.findOne(branchId);
    if (!branch) {
      throw new NotFoundException(BRANCH_NOT_FOUND);
    }
    if (branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(FORBIDDEN);
    }

    const staffMembersCount = await this.staffRepository.count({
      where: { id: In(staffIds), tenantId: currentUser.tenantId, deletedAt: IsNull() },
    });

    if (staffMembersCount !== staffIds.length) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    await this.branchStafferRepository.delete({
      branchId,
      stafferId: In(staffIds),
    });

    await Promise.all([
      this.cacheManager.del(`staff#${currentUser.tenantId}`),
      this.cacheManager.del(`staff#${currentUser.tenantId}_${branchId}`),
    ]);
  }


  async getUnseenNotificationsCount(userId: string) {
    const user = await this.staffRepository.findOne({
      where: { id: userId },
      select: { notificationsCount: true }
    });

    return user?.notificationsCount ?? 0;
  }


  async resetNotificationsCount(userId: string) {
    await this.staffRepository.update(userId, {
      notificationsCount: 0,
    });
  }

  async incrementNotificationsCount(staffIds: string[]) {
    if (!staffIds?.length) return;
    // NULL-safe: rows created before the column existed have NULL, and
    // NULL + 1 stays NULL — the badge would never move for those users.
    await this.staffRepository
      .createQueryBuilder()
      .update()
      .set({
        notificationsCount: () => 'COALESCE("notificationsCount", 0) + 1',
      })
      .where('id IN (:...staffIds)', { staffIds })
      .execute();
  }

  async requestAccountDeletion(
    { password }: RequestAccountDeletionDto,
    currentUser: SessionUser,
  ) {
    if (currentUser.role === StaffRole.OWNER) {
      throw new ForbiddenException(OWNER_CANNOT_DELETE_ACCOUNT);
    }

    const staff = await this.getById(currentUser.id);
    if (!staff) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    const isPasswordValid = await verifyPassword({
      hash: staff.password,
      password,
    });

    if (!isPasswordValid) {
      throw new BadRequestException(INVALID_CREDENTIALS);
    }

    await this.verificationService.sendVerificationEmail(
      staff,
      VerificationContext.ACCOUNT_DELETION,
    );
  }

  @Transactional()
  async verifyAccountDeletion(
    { code }: VerifyAccountDeletionDto,
    currentUser: SessionUser,
  ) {
    if (currentUser.role === StaffRole.OWNER) {
      throw new ForbiddenException(OWNER_CANNOT_DELETE_ACCOUNT);
    }

    const staff = await this.getById(currentUser.id);
    if (!staff) {
      throw new NotFoundException(STAFF_NOT_FOUND);
    }

    const { isValid, errorCode } = await this.verificationService.verifyCode({
      code,
      userType: UserType.Staff,
      identifier: staff.email,
      channel: VerificationChannel.EMAIL,
      context: VerificationContext.ACCOUNT_DELETION,
    });

    if (!isValid) {
      throw new BadRequestException(errorCode);
    }

    await this.staffRepository.update(currentUser.id, {
      deletedAt: new Date(),
    });

    await this.verificationService.delete({
      userId: currentUser.id,
      context: VerificationContext.ACCOUNT_DELETION,
    });

    await this.authService.logout(currentUser);
    await this.cacheManager.del(`staff#${currentUser.tenantId}`);
  }
}
