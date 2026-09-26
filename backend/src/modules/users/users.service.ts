import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLockService } from 'src/common/distributed-lock.service';
import { FindOptionsSelect, FindOptionsWhere, In, IsNull, Not, Repository, LessThan} from 'typeorm';
import { User, type UserCountKey } from './entities/user.entity';
import {
  Account,
  AccountProvider,
} from 'src/modules/auth/entities/account.entity';
import {
  BadRequestException,
  Inject,
  Logger,
  forwardRef,
  ForbiddenException,
} from '@nestjs/common';
import { SendPhoneCodeDto } from 'src/modules/auth/dto/send-code.dto';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { NotFoundException } from '@nestjs/common';
import { AssetsService } from 'src/modules/assets/assets.service';
import { AssetType } from 'src/modules/assets/entities/asset.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { dayjs } from '../shared/dayjs';
import {
  EMAIL_ALREADY_EXISTS,
  EMAIL_ALREADY_VERIFIED,
  PHONE_NUMBER_ALREADY_EXISTS,
  PHONE_NUMBER_ALREADY_VERIFIED,
  USER_NOT_FOUND,
  INVALID_PHONE_NUMBER,
  SPORT_NOT_FOUND,
  ACCOUNT_HAS_UPCOMING_BOOKINGS,
  NOT_ALLOWED,
} from '../shared/error-codes';
import { uniqueUsernameGenerator } from 'unique-username-generator';
import { parsePhoneNumberWithError } from 'libphonenumber-js/max';
import { Injectable } from '@nestjs/common';
import { merge } from 'lodash';
import { UpsertSportDto } from './dto/upsert-sport.dto';
import { UserSport } from './entities/sport.entity';
import { UsersSortBy, ListUsersDto } from './dto/list-users.dto';
import { SortDirection } from 'src/common/sort';
import { UserType } from 'src/modules/auth/@types/user.type';
import { Friendship } from '../friendships/entities/friendship.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Court } from '../courts/entities/court.entity';
import { Branch } from '../branches/entities/branch.entity';
import { VerificationService } from '../auth/verification.service';
import {
  VerificationChannel,
  VerificationContext,
} from '../auth/entities/verification.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UserEvent } from './users.events';
import { BookingEventType } from '../bookings/entities/event.entity';
import type {
  BookingCreatedEventPayload,
  BookingCancelledEventPayload,
  BookingPaymentCapturedEventPayload,
  BookingPaymentRefundedEventPayload,
} from '../bookings/bookings.events';
import { VerifyPhoneCodeDto } from '../auth/dto/verify-code.dto';
import { VerifyUpdateEmailCodeDto } from './dto/verify-email.dto';
import { SendEmailCodeDto } from './dto/send-email-code.dto';
import { CheckUsernameResponseDto } from '../auth/dto/check-username.dto';
import { ListUsersResponseDto } from './dto/list-users-response.dto';
import type { EmailVerifiedPayload } from './users.events';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AuthService } from '../auth/auth.service';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { Session, SessionStatus } from '../auth/entities/session.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { TenantBlockedUser } from './entities/tenant-blocked-user.entity';
import { UserPreferencesDto } from './dto/user-preferences.dto';
import { Language } from './entities/enums';
import { StaffRole } from '../staff/entities/enum';

type RelationKey = 'sports';
/**
 * How long a deleted account can still be recovered before its phone
 * number, e-mail and username are released for reuse.
 */
export const ACCOUNT_RECOVERY_WINDOW_DAYS = 30;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private readonly defaultNotificationSettings = {
    followers: true,
    likes: true,
    openBookings: true,
    bookingActivity: true,
    updates: true,
    nearbyCourts: true,
  };

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(TenantBlockedUser)
    private readonly tenantBlockRepository: Repository<TenantBlockedUser>,
    private readonly lockService: DistributedLockService,
    @InjectRepository(UserSport)
    private readonly sportsRepository: Repository<UserSport>,
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(UserPreferences)
    private readonly preferencesRepository: Repository<UserPreferences>,
    private readonly verificationService: VerificationService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly assetsService: AssetsService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async getById(
    id: string,
    options: {
      cached: boolean;
      relations?: RelationKey[];
      friendship?: string;
    } = {
        cached: true,
      },
  ) {
    const { cached, relations, friendship } = options;
    const cachedUser = cached
      ? await this.cacheManager.get<User>(`user#${id}`)
      : null;
    if (cachedUser) {
      return cachedUser;
    }

    const query = this.usersRepository.createQueryBuilder('user');

    if (relations?.includes('sports')) {
      query.leftJoinAndSelect('user.sports', 'sports');
    }

    query.where('user.id = :id', { id });
    // A deleted account must not be reachable by id (profile pages, follower
    // lists); auth paths that need the row use the repository directly.
    query.andWhere('user.deletedAt IS NULL');

    if (friendship) {
      query
        .leftJoin(
          Friendship,
          'follower',
          'follower.followerId = :currentUserId AND follower.followingId = user.id',
          { currentUserId: friendship },
        )
        .leftJoin(
          Friendship,
          'followed',
          'followed.followerId = user.id AND followed.followingId = :currentUserId',
          { currentUserId: friendship },
        )
        .addSelect([
          'CASE WHEN follower.id IS NOT NULL THEN true ELSE false END as "isFollowing"',
          'CASE WHEN followed.id IS NOT NULL THEN true ELSE false END as "isFollowed"',
        ]);

      const result = await query.getRawAndEntities();
      if (result.entities.length === 0) return null;

      const user = result.entities[0];
      const raw = result.raw[0];
      user.isFollowing = raw.isFollowing;
      user.isFollowed = raw.isFollowed;
      return user;
    }

    const user = await query.getOne();

    if (user) {
      this.cacheManager.set(`user#${id}`, user);
    }

    return user;
  }

  async count(where: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
    return this.usersRepository.count({ where });
  }

  @Transactional()
  async update(
    id: string,
    {
      avatarAssetId,
      coverAssetId,
      ...data
    }: UpdateUserDto & { verifiedAt?: Date; deletedAt?: Date; stripeCustomerId?: string },
    sessionUser?: SessionUser,
  ) {
    const user = await this.exists({ id });
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    const update: any = { ...data };
    if (avatarAssetId) {
      const assets = await this.assetsService.assignAssets(avatarAssetId, id, AssetType.ProfilePicture, id);
      update.avatarUrl = assets[0]?.url;
    }
    if (coverAssetId) {
      const assets = await this.assetsService.assignAssets(coverAssetId, id, AssetType.CoverPicture, id);
      update.coverUrl = assets[0]?.url;
    }

    if (update.dateOfBirth) {
      update.dateOfBirth = dayjs(update.dateOfBirth)
        .startOf('day')
        .format('YYYY-MM-DD');
    }

    await this.usersRepository.update(id, update);

    this.invalidateUser(id);
    // Fetch with relations so the re-cached user is complete — caching a
    // sport-less user here would hide sports from subsequent GET /users/me.
    return this.getById(id, { cached: false, relations: ['sports'] });
  }

  async get(where: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
    return this.usersRepository.findOne({ where });
  }

  async exists(where: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
    return this.usersRepository.exists({ where });
  }

  async checkUsername(username: string): Promise<CheckUsernameResponseDto> {
    const exists = await this.exists({ username });
    if (exists) {
      const suggestions = await this.generateUsernames(username, 3);

      return {
        available: false,
        suggestions: suggestions,
      };
    }
    return {
      available: true,
    };
  }

  private async generateUsernames(username: string, count: number) {
    const batchSize = Math.max(count * 2, 10);
    const maxBatches = 5;
    const availableUsernames: string[] = [];
    const usedUsernames = new Set<string>();

    for (
      let batch = 0;
      batch < maxBatches && availableUsernames.length < count;
      batch++
    ) {
      const candidates = new Set<string>();
      while (candidates.size < batchSize) {
        const generatedUsername = uniqueUsernameGenerator({
          separator: '',
          dictionaries: [[username]],
          style: 'lowerCase',
          randomDigits: 3,
        });

        if (!usedUsernames.has(generatedUsername)) {
          candidates.add(generatedUsername);
          usedUsernames.add(generatedUsername);
        }
      }

      const candidateArray = Array.from(candidates);
      const existingUsernames = await this.usersRepository
        .createQueryBuilder('user')
        .select('user.username')
        .where('user.username IN (:...usernames)', {
          usernames: candidateArray,
        })
        .getRawMany();

      const existingUsernamesSet = new Set(
        existingUsernames.map((row) => row.username),
      );

      const batchAvailable = candidateArray.filter(
        (candidate) => !existingUsernamesSet.has(candidate),
      );
      availableUsernames.push(
        ...batchAvailable.slice(0, count - availableUsernames.length),
      );

      if (availableUsernames.length >= count) {
        break;
      }
    }

    return availableUsernames.slice(0, count);
  }

  @Transactional()
  async create(data: Partial<User>, provider: AccountProvider) {
    const user = await this.usersRepository.save(data);
    await this.accountsRepository.save({
      userId: user.id,
      provider,
    });
    return user;
  }

  async sendUpdatePhoneNumberVerification(
    { phoneNumber }: SendPhoneCodeDto,
    { id: userId }: SessionUser,
    ip: string,
  ) {
    const [user, phoneNumberUser] = await Promise.all([
      this.getById(userId),
      this.exists({ phoneNumber }),
    ]);
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }
    if (user.phoneNumber === phoneNumber) {
      throw new BadRequestException(PHONE_NUMBER_ALREADY_VERIFIED);
    }

    if (phoneNumberUser) {
      throw new BadRequestException(PHONE_NUMBER_ALREADY_EXISTS);
    }
    await this.usersRepository.update(userId, {
      pendingPhoneNumber: phoneNumber,
    });
    await this.verificationService.sendPhoneCode(phoneNumber, ip);
    this.invalidateUser(userId);
  }

  async verifyPhoneNumber(
    { phoneNumber, code }: VerifyPhoneCodeDto,
    currentUser: SessionUser,
  ) {
    const user = await this.getById(currentUser.id);
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    if (user.pendingPhoneNumber !== phoneNumber) {
      throw new BadRequestException(INVALID_PHONE_NUMBER);
    }

    const { isValid, errorCode } = await this.verificationService.verifyCode({
      code,
      userType: UserType.Customer,
      identifier: phoneNumber,
      channel: VerificationChannel.PHONE,
    });

    if (!isValid) {
      throw new BadRequestException(errorCode);
    }

    const parsedPhoneNumber = parsePhoneNumberWithError(phoneNumber);
    const formattedPhoneNumber = parsedPhoneNumber.format('E.164');

    await this.usersRepository.update(currentUser.id, {
      phoneNumber: formattedPhoneNumber,
      pendingPhoneNumber: null,
    });
    this.invalidateUser(currentUser.id);
  }

  async upsertSport(userId: string, { level, name, timePreference }: UpsertSportDto): Promise<UserSport> {
    const user = await this.exists({ id: userId });
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }
    const sport = new UserSport()
    sport.userId = userId;
    sport.name = name;
    sport.level = level;
    sport.timePreference = timePreference;
    await this.sportsRepository.upsert(sport, { conflictPaths: ['userId', 'name'] });

    await this.invalidateUser(userId);

    return sport;
  }

  async deleteSport(userId: string, sportId: string) {
    const user = await this.exists({ id: userId });
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    const result = await this.sportsRepository.delete({
      id: sportId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(SPORT_NOT_FOUND);
    }
    await this.invalidateUser(userId);
  }

  async getSports(userId: string) {
    return this.sportsRepository.find({
      where: { userId },
    });
  }

  async findByIds(ids: string[], select?: FindOptionsSelect<User>) {
    const users = await this.usersRepository.find({
      where: {
        id: In(ids),
      },
      select,
    });

    return users;
  }

  async find(
    {
      search,
      page = 1,
      pageSize = 10,
      ids,
      sortBy,
      sortOrder = SortDirection.DESC,
      blocked,
    }: ListUsersDto & { ids?: string[]; blocked?: boolean },
    currentUser: SessionUser,
  ): Promise<ListUsersResponseDto> {
    const query = this.usersRepository.createQueryBuilder('user');
    const isCustomer = currentUser.type === UserType.Customer;
    query.where('user.deletedAt IS NULL');

    if (isCustomer) {
      query
        .leftJoin(
          Friendship,
          'following',
          'following.followerId = :currentUserId AND following.followingId = user.id',
          { currentUserId: currentUser.id },
        )
        .leftJoin(
          Friendship,
          'followed',
          'followed.followerId = user.id AND followed.followingId = :currentUserId',
          { currentUserId: currentUser.id },
        )
        .addSelect([
          'CASE WHEN following.id IS NOT NULL THEN true ELSE false END as "isFollowing"',
          'CASE WHEN followed.id IS NOT NULL THEN true ELSE false END as "isFollowed"',
        ]);

      query.andWhere('user.id != :uid', { uid: currentUser.id });

      // Blocking was recorded and never enforced: a blocked person still
      // showed up in search and in people lists for both sides. Excluded in
      // BOTH directions — I do not see whom I blocked, and I do not appear to
      // whoever blocked me. Queried directly rather than through
      // BlocksService because BlocksModule already imports UsersModule.
      query.andWhere(
        `NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE (b."blockerId" = :blockViewerId AND b."blockedId" = user.id)
             OR (b."blockedId" = :blockViewerId AND b."blockerId" = user.id)
        )`,
        { blockViewerId: currentUser.id },
      );
    }

    // Tenant staff (non-SuperAdmin) only see customers who have bookings
    // at branches belonging to their tenant.
    if (
      currentUser.type === UserType.Staff &&
      currentUser.role !== StaffRole.SUPER_ADMIN &&
      currentUser.tenantId
    ) {
      query.andWhere(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .select('1')
            .from(Booking, 'booking')
            .innerJoin(Court, 'court', 'court.id = booking.courtId')
            .innerJoin(Branch, 'branch', 'branch.id = court.branchId')
            .where('booking.userId = user.id')
            .andWhere('branch.tenantId = :tenantId')
            .getQuery();
          return `EXISTS ${subQuery}`;
        },
        { tenantId: currentUser.tenantId },
      );
    }

    if (search) {
      query.andWhere(
        '(user.username ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (ids && ids.length > 0) {
      query.andWhere('user.id IN (:...ids)', { ids });
    }

    // For vendor staff "blocked" means blocked AT THIS VENUE; the global
    // column is the platform-wide ban only SuperAdmin can set.
    const isTenantScopedViewer =
      currentUser.type === UserType.Staff &&
      currentUser.role !== StaffRole.SUPER_ADMIN &&
      !!currentUser.tenantId;

    if (blocked !== undefined) {
      if (isTenantScopedViewer) {
        const existsBlock = `EXISTS (SELECT 1 FROM tenant_blocked_users tbu WHERE tbu."userId" = user.id AND tbu."tenantId" = :blockTenantId)`;
        query.andWhere(blocked ? existsBlock : `NOT ${existsBlock}`, {
          blockTenantId: currentUser.tenantId,
        });
      } else if (blocked === true) {
        query.andWhere('user.blockedAt IS NOT NULL');
      } else {
        query.andWhere('user.blockedAt IS NULL');
      }
    }

    if (currentUser.type === UserType.Staff) {
      if (sortBy === UsersSortBy.Spending) {
        query.orderBy('user.totalSpent', sortOrder);
      } else if (sortBy === UsersSortBy.Bookings) {
        query.orderBy('user.bookingsCount', sortOrder);
      } else if (sortBy === UsersSortBy.Reviews) {
        query.orderBy('user.reviewsCount', sortOrder);
      } else if (sortBy === UsersSortBy.Followers) {
        query.orderBy('user.followersCount', sortOrder);
      } else if (sortBy === UsersSortBy.Following) {
        query.orderBy('user.followingCount', sortOrder);
      } else if (sortBy === UsersSortBy.Minutes) {
        query.orderBy('user.minutesBookedCount', sortOrder);
      }
    }
    const [total, result] = await Promise.all([
      query.clone().getCount(),
      query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getRawAndEntities(),
    ]);

    let items = isCustomer ? result.entities.map((user, index) => {
      const raw = result.raw[index];
      user.isFollowing = raw.isFollowing;
      user.isFollowed = raw.isFollowed;
      return user;
    }) : result.entities;

    // Vendor staff see THEIR OWN block state, not the platform-wide flag they
    // can no longer set. Without this the dashboard's Block button appeared to
    // do nothing after blocking became tenant-scoped.
    if (
      currentUser.type === UserType.Staff &&
      currentUser.role !== StaffRole.SUPER_ADMIN &&
      currentUser.tenantId &&
      items.length
    ) {
      const blocks = await this.tenantBlockRepository.find({
        where: {
          tenantId: currentUser.tenantId,
          userId: In(items.map((u) => u.id)),
        },
      });
      const blockedAtByUser = new Map(
        blocks.map((b) => [b.userId, b.createdAt]),
      );
      // Report the venue's OWN block state, not the platform-wide flag. A
      // customer banned by SuperAdmin is not something this vendor can lift,
      // and showing them as blocked made the Unblock button look broken.
      items = items.map((user) =>
        Object.assign(user, { blockedAt: blockedAtByUser.get(user.id) ?? null }),
      );
    }

    return {
      items,
      pagination: {
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
  async incrementCount(userId: string, count: number, field: UserCountKey) {
    await this.usersRepository.update(userId, {
      [field]: () => `GREATEST(${field}  + ${count}, 0)`,
    });
    await this.invalidateUser(userId);
  }

  async getUnseenNotificationsCount(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: { notificationsCount: true },
    });

    return user?.notificationsCount ?? 0;
  }

  async sendUpdateEmailVerification(
    { email }: SendEmailCodeDto,
    { id: userId }: SessionUser,
  ) {
    const [user, emailUser] = await Promise.all([
      this.getById(userId),
      this.exists({ email }),
    ]);

    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    if (user.email === email) {
      throw new BadRequestException(EMAIL_ALREADY_VERIFIED);
    }

    if (emailUser) {
      throw new BadRequestException(EMAIL_ALREADY_EXISTS);
    }

    await this.usersRepository.update(userId, {
      pendingEmail: email,
    });

    user.email = email;
    await this.verificationService.sendVerificationEmail(
      user,
      VerificationContext.EMAIL_VERIFICATION,
    );
    await this.invalidateUser(userId);
  }

  @Transactional()
  async verifyEmail(
    { email, code }: VerifyUpdateEmailCodeDto,
    currentUser: SessionUser,
  ) {
    const user = await this.exists({ id: currentUser.id });
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    const { isValid, errorCode } = await this.verificationService.verifyCode({
      code,
      userType: UserType.Customer,
      identifier: email,
      context: VerificationContext.EMAIL_VERIFICATION,
      channel: VerificationChannel.EMAIL,
    });

    if (!isValid) {
      throw new BadRequestException(errorCode);
    }

    await this.usersRepository.update(currentUser.id, {
      email,
      pendingEmail: null,
      emailVerified: new Date(),
    });
    runOnTransactionCommit(() => {
      this.eventEmitter.emit(UserEvent.EMAIL_VERIFIED, {
        email,
        userId: currentUser.id,
      } satisfies EmailVerifiedPayload);
    });
  }

  @Transactional()
  async removeAsset(userId: string, assetType: AssetType) {
    const user = await this.exists({ id: userId });
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    await this.assetsService.unassignAssetsByResource(userId, assetType);

    const assetTypeKey =
      assetType === AssetType.ProfilePicture ? 'avatarUrl' : 'coverUrl';
    await this.usersRepository.update(userId, { [assetTypeKey]: null });
    this.invalidateUser(userId);
  }

  @Transactional()
  async delete(currentUser: SessionUser) {
    // A paid booking tomorrow must be cancelled (refunded) before the
    // account goes; otherwise it is orphaned with no one to notify.
    const [{ count }] = await this.usersRepository.manager.query(
      `SELECT COUNT(*)::int AS count FROM bookings b
       WHERE b."userId" = $1 AND b.status IN ('pending','in_progress') AND b."endDate" > NOW()`,
      [currentUser.id],
    );
    if (Number(count) > 0) {
      throw new BadRequestException(ACCOUNT_HAS_UPCOMING_BOOKINGS);
    }
    await this.usersRepository.update(currentUser.id, {
      deletedAt: new Date(),
    });
    // Every device, not only the one that pressed Delete.
    await this.authService.revokeAllSessions(currentUser.id);
    await this.authService.logout(currentUser);
    this.invalidateUser(currentUser.id);
  }

  /**
   * Release a deleted account's phone number, e-mail and username once the
   * recovery window has passed.
   *
   * Deleting only set `deletedAt`, but those three columns carry unique
   * indexes — so the number stayed claimed for ever and the person could
   * never sign up again, while the username was burned for everybody. The row
   * itself is kept so past bookings and reviews still resolve; only the
   * identifying fields are cleared.
   *
   * ACCOUNT_RECOVERY_WINDOW_DAYS is the product knob: inside it "Start Fresh"
   * can still restore the account, outside it the identifiers are released.
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purgeExpiredDeletedUsers(): Promise<void> {
    await this.lockService.runExclusively(
      'users:purge-deleted',
      10 * 60 * 1000,
      async () => {
        const cutoff = new Date(
          Date.now() - ACCOUNT_RECOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
        );

        const expired = await this.usersRepository.find({
          where: { deletedAt: LessThan(cutoff) },
          select: { id: true },
        });
        const stale = expired.filter(Boolean);
        if (!stale.length) {
          return;
        }

        for (const { id } of stale) {
          // Null, not a placeholder: the unique indexes allow many NULLs, so
          // this frees the identifier without colliding with other purged
          // rows.
          await this.usersRepository.update(
            { id, phoneNumber: Not(IsNull()) },
            {
              phoneNumber: null,
              email: null,
              username: null,
              firstName: null,
              lastName: null,
              bio: null,
              dateOfBirth: null,
              avatarUrl: null,
              coverUrl: null,
              firebaseUid: null,
              pendingEmail: null,
              pendingPhoneNumber: null,
            },
          );
          await this.invalidateUser(id);
        }

        this.logger.log(
          `Released identifiers for ${stale.length} account(s) deleted before ${cutoff.toISOString()}`,
        );
      },
    );
  }

  async resetNotificationsCount(userId: string) {
    await this.usersRepository.update(userId, {
      notificationsCount: 0,
    });
    this.invalidateUser(userId);
  }

  async incrementNotificationsCount(userIds: string[]) {
    if (!userIds?.length) return;
    await this.usersRepository.increment(
      { id: In(userIds) },
      'notificationsCount',
      1,
    );
  }

  async invalidateUser(userId: string) {
    await this.cacheManager.del(`user#${userId}`);
  }

  /**
   * PLATFORM-WIDE block. Locks the customer out of the whole marketplace, so
   * it is restricted to SuperAdmin at the controller. Vendors use
   * setTenantBlock() instead.
   */
  async blockUser(userId: string, blocked: boolean): Promise<void> {
    const user = await this.exists({ id: userId });
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    await this.usersRepository.update(userId, {
      blockedAt: blocked ? new Date() : null,
    });
    await this.invalidateUser(userId);
  }

  /**
   * Block or unblock a customer AT ONE VENUE. The customer keeps their
   * account and can still book everywhere else.
   *
   * A vendor may only act on a customer who has actually booked with them,
   * so a tenant cannot enumerate or touch strangers' accounts.
   */
  async setTenantBlock(
    tenantId: string,
    userId: string,
    blocked: boolean,
    blockedByStaffId?: string,
    reason?: string,
  ): Promise<void> {
    const user = await this.exists({ id: userId });
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    if (!blocked) {
      await this.tenantBlockRepository.delete({ tenantId, userId });
      return;
    }

    const hasBooked = await this.hasBookingAtTenant(tenantId, userId);
    if (!hasBooked) {
      throw new ForbiddenException(NOT_ALLOWED);
    }

    // Idempotent: re-blocking an already blocked customer is a no-op rather
    // than a unique-constraint 500.
    await this.tenantBlockRepository
      .createQueryBuilder()
      .insert()
      .into(TenantBlockedUser)
      .values({ tenantId, userId, blockedByStaffId, reason })
      .orIgnore()
      .execute();
  }

  async isBlockedForTenant(tenantId: string, userId: string): Promise<boolean> {
    return this.tenantBlockRepository.exists({ where: { tenantId, userId } });
  }

  /** Customer ids this tenant has blocked, for list rendering. */
  async listTenantBlockedUserIds(tenantId: string): Promise<string[]> {
    const rows = await this.tenantBlockRepository.find({
      where: { tenantId },
      select: ['userId'],
    });
    return rows.map((r) => r.userId);
  }

  private async hasBookingAtTenant(
    tenantId: string,
    userId: string,
  ): Promise<boolean> {
    const found = await this.usersRepository.manager
      .createQueryBuilder()
      .select('1')
      .from(Booking, 'booking')
      .innerJoin(Court, 'court', 'court.id = booking.courtId')
      .innerJoin(Branch, 'branch', 'branch.id = court.branchId')
      .where('booking.userId = :userId', { userId })
      .andWhere('branch.tenantId = :tenantId', { tenantId })
      .limit(1)
      .getRawOne();
    return !!found;
  }

  @OnEvent(UserEvent.EMAIL_VERIFIED)
  private async handleEmailVerified(payload: EmailVerifiedPayload) {
    const { email, userId } = payload;
    await Promise.allSettled([
      this.invalidateUser(userId),
      this.verificationService.delete({
        identifier: email,
        context: VerificationContext.EMAIL_VERIFICATION,
      }),
    ]);
  }

  @OnEvent(BookingEventType.CREATED)
  private async handleBookingCreated({ booking }: BookingCreatedEventPayload) {
    try {
      // Creator-only: staff-created bookings have booking.userId = null, and
      // there is no single clean event covering every participant-join path
      // (auto-join, invitation accept, join-request approval differ), so
      // non-creator participants are intentionally not counted here.
      if (!booking?.userId) return;
      await this.incrementCount(booking.userId, 1, 'bookingsCount');
    } catch (error) {
      this.logger.error('Failed to update user stats for booking created', error);
    }
  }

  @OnEvent(BookingEventType.CANCELLED)
  private async handleBookingCancelled({
    booking,
  }: BookingCancelledEventPayload) {
    try {
      if (!booking?.userId) return;
      await this.incrementCount(booking.userId, -1, 'bookingsCount');
    } catch (error) {
      this.logger.error(
        'Failed to update user stats for booking cancelled',
        error,
      );
    }
  }

  @OnEvent(BookingEventType.PAYMENT_CAPTURED)
  private async handleBookingPaymentCaptured({
    userId,
    amount,
    paymentId,
  }: BookingPaymentCapturedEventPayload) {
    try {
      const capturedAmount = Number(amount);
      if (!userId || !Number.isFinite(capturedAmount) || capturedAmount <= 0) {
        this.logger.warn(
          `Skipping user stats for captured payment - paymentId: ${paymentId}, userId: ${userId}, amount: ${amount}`,
        );
        return;
      }
      await this.incrementCount(userId, capturedAmount, 'totalSpent');
    } catch (error) {
      this.logger.error('Failed to update user stats for payment captured', error);
    }
  }

  @OnEvent(BookingEventType.PAYMENT_REFUNDED)
  private async handleBookingPaymentRefunded({
    userId,
    amount,
    paymentId,
  }: BookingPaymentRefundedEventPayload) {
    try {
      const refundedAmount = Number(amount);
      if (!userId || !Number.isFinite(refundedAmount) || refundedAmount <= 0) {
        this.logger.warn(
          `Skipping user stats for refunded payment - paymentId: ${paymentId}, userId: ${userId}, amount: ${amount}`,
        );
        return;
      }
      await this.incrementCount(userId, -refundedAmount, 'totalSpent');
    } catch (error) {
      this.logger.error('Failed to update user stats for payment refunded', error);
    }
  }

  async getPreferences(userId: string, deviceId: string): Promise<UserPreferences> {
    const cacheKey = `user_preferences#${userId}_${deviceId}`;

    const cached = await this.cacheManager.get<UserPreferences>(cacheKey);
    if (cached) {
      return cached;
    }

    const preferences = await this.preferencesRepository.findOne({
      where: { userId, deviceId },
    });

    if (preferences) {
      await this.cacheManager.set(cacheKey, preferences, 300000);
      return preferences;
    }

    const defaultPreferences = {
      userId,
      deviceId,
      language: Language.EN,
      currency: 'USD',
      notifications: this.defaultNotificationSettings,
    } as UserPreferences;

    await this.cacheManager.set(cacheKey, defaultPreferences, 300000);
    return defaultPreferences;



  }

  @Transactional()
  async updatePreferences(
    userId: string, deviceId: string,
    updatePreferencesDto: UserPreferencesDto,
  ): Promise<UserPreferences> {
    const userExists = await this.exists({ id: userId });
    if (!userExists) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    let preferences = await this.preferencesRepository.findOne({
      where: { userId, deviceId },
    });

    if (!preferences) {
      preferences = new UserPreferences();
      preferences.userId = userId;
      preferences.deviceId = deviceId;
      preferences.language = Language.EN;
      preferences.currency = 'USD';
      preferences.notifications = this.defaultNotificationSettings;
    }

    if (updatePreferencesDto.language !== undefined) {
      preferences.language = updatePreferencesDto.language;
    }
    if (updatePreferencesDto.currency !== undefined) {
      preferences.currency = updatePreferencesDto.currency;
    }

    if (updatePreferencesDto.notifications) {
      preferences.notifications = merge(
        {},
        preferences.notifications,
        updatePreferencesDto.notifications
      );
    }

    const saved = await this.preferencesRepository.save(preferences);
    await this.cacheManager.del(`user_preferences#${userId}_${deviceId}`);

    return saved;
  }

  async getActiveSessionsWithPreferences(userIds: string[]) {
    return this.sessionsRepository
      .createQueryBuilder('session')
      .where('session.userId IN (:...userIds)', { userIds })
      .andWhere('session.status = :status', { status: SessionStatus.ACTIVE })
      .andWhere('session.fcmToken IS NOT NULL')
      .leftJoinAndMapOne(
        'session.preferences',
        UserPreferences,
        'preferences',
        'preferences.userId = session.userId AND preferences.deviceId = session.deviceId',
      )
      .getMany();
  }

  async getUserEmailsWithLanguage(userIds: string[]): Promise<{ email: string; language: Language }[]> {
    if (userIds.length === 0) return [];

    const results = await this.usersRepository
      .find({
        where: {
          id: In(userIds),
          email: Not(IsNull()),
        },
        select: {
          email: true,
          preferences: {
            language: true,
          },
        },
      })

    return results.map((r) => ({
      email: r.email,
      language: r.preferences?.language || Language.EN,
    }));
  }
}
