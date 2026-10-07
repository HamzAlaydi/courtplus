import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { createHash } from 'crypto';
import { nanoid } from 'nanoid';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';

import {
  VendorRegistration,
  VendorRegistrationStatus,
} from './entities/vendor-registration.entity';
import {
  StaffInvitation,
  StaffInvitationStatus,
} from '../staff/entities/staff-invitation.entity';
import { StaffRole } from '../staff/entities/enum';
import { Staffer } from '../staff/entities/staff.entity';
import { EmailService, EmailTemplate } from '../shared/services/email.service';
import { MailService } from '../shared/services/mail.service';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { dayjs } from '../shared/dayjs';

/** Matches the staff-invitation window so both links behave the same. */
const REGISTRATION_TTL_DAYS = 7;

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    @InjectRepository(VendorRegistration)
    private readonly registrationRepository: Repository<VendorRegistration>,
    @InjectRepository(StaffInvitation)
    private readonly invitationRepository: Repository<StaffInvitation>,
    @InjectRepository(Staffer)
    private readonly staffRepository: Repository<Staffer>,
    private readonly emailService: EmailService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a facility owner from the marketing site.
   *
   * Creates a durable registration row (so a lead can never be lost to a
   * spam-filtered email, which is what the old contact-form behaviour risked),
   * mints a single-use invitation token, and emails the link to the VENDOR.
   *
   * Always resolves the same way regardless of whether the address is already
   * in use — returning "this email is taken" here would turn a public endpoint
   * into an account-enumeration oracle for every vendor on the platform.
   */
  @Transactional()
  async register(dto: VendorRegisterDto): Promise<void> {
    const email = dto.email; // already trimmed + lowercased by the DTO

    const existingStaff = await this.staffRepository.findOne({
      where: { email },
      select: { id: true },
    });

    // Record the attempt either way so sales can see demand, and so a genuine
    // owner who forgot they already signed up still shows up in the funnel.
    const registration = await this.registrationRepository.save(
      this.registrationRepository.create({
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        facilityName: dto.facilityName,
        phoneNumber: dto.phoneNumber,
        city: dto.city,
        status: VendorRegistrationStatus.PENDING,
      }),
    );

    if (existingStaff) {
      this.logger.log(
        `[VENDOR_SIGNUP] Registration for an existing account: ${email} (registration ${registration.id}). Sending a sign-in email instead of a new link.`,
      );
      runOnTransactionCommit(() => {
        // Still an email, just a different one. The form promises "check your
        // inbox", and silence here made that promise false for anyone who had
        // already signed up — while the identical HTTP response keeps the
        // endpoint useless for probing which addresses exist.
        void this.sendAccountExists(dto);
        void this.notifyInternal(dto, true);
      });
      return;
    }

    // Supersede any earlier pending link for this address so only the newest
    // one works — otherwise every resubmission leaves another live token.
    await this.invitationRepository.update(
      { email, status: StaffInvitationStatus.PENDING, tenantId: null },
      { status: StaffInvitationStatus.REJECTED },
    );
    await this.registrationRepository.update(
      {
        email,
        status: VendorRegistrationStatus.PENDING,
        id: Not(registration.id),
      },
      { status: VendorRegistrationStatus.SUPERSEDED },
    );

    const token = nanoid(32);
    const invitation = await this.invitationRepository.save({
      email,
      // tenantId stays null: this vendor is not joining someone else's
      // business, a tenant is created for them when they redeem the link.
      tenantId: null,
      branchId: null,
      role: StaffRole.OWNER,
      token: createHash('sha256').update(token).digest('hex'),
      expires: dayjs().add(REGISTRATION_TTL_DAYS, 'days').toDate(),
      status: StaffInvitationStatus.PENDING,
    });

    registration.invitationId = invitation.id;
    await this.registrationRepository.save(registration);

    const baseUrl = this.configService.get<string>('app.frontendUrl');
    const registrationLink = `${baseUrl}/auth/signup?token=${token}&email=${encodeURIComponent(email)}`;

    // Sent after commit so a failed send cannot roll back the registration —
    // the lead survives even if email delivery does not.
    runOnTransactionCommit(() => {
      void this.sendVendorLink(dto, registrationLink);
      void this.notifyInternal(dto, false);
    });
  }

  private async sendVendorLink(
    dto: VendorRegisterDto,
    registrationLink: string,
  ): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: [dto.email],
        template: EmailTemplate.VENDOR_REGISTRATION,
        data: {
          registrationLink,
          firstName: dto.firstName,
          facilityName: dto.facilityName,
          expiresInDays: REGISTRATION_TTL_DAYS,
        },
      });
    } catch (error) {
      // Greppable: the vendor is waiting on this link and will not know it
      // failed. The registration row is the recovery path.
      this.logger.error(
        `[VENDOR_SIGNUP][RESEND] Could not email the registration link to ${dto.email}`,
        error as Error,
      );
    }
  }

  /**
   * Tell an existing account holder that they already have access, rather than
   * leaving them waiting for a registration link that will never come.
   */
  private async sendAccountExists(dto: VendorRegisterDto): Promise<void> {
    const baseUrl = this.configService.get<string>('app.frontendUrl');
    try {
      await this.emailService.sendEmail({
        to: [dto.email],
        template: EmailTemplate.VENDOR_ACCOUNT_EXISTS,
        data: {
          firstName: dto.firstName,
          facilityName: dto.facilityName,
          signInLink: `${baseUrl}/auth/signin`,
          resetPasswordLink: `${baseUrl}/auth/forget-password`,
        },
      });
    } catch (error) {
      this.logger.error(
        `[VENDOR_SIGNUP] Could not email the account-exists notice to ${dto.email}`,
        error as Error,
      );
    }
  }

  /** Keeps the sales notification the old contact form provided. */
  private async notifyInternal(
    dto: VendorRegisterDto,
    alreadyRegistered: boolean,
  ): Promise<void> {
    const inbox =
      this.configService.get<string>('aws.contactInboxEmail') ||
      this.configService.get<string>('aws.sesFromEmail');
    if (!inbox) return;

    try {
      // Branded template rather than the plain-text body this used to send:
      // the team reads these as a lead queue, so it needs the facility name to
      // lead, the contact details laid out, and a one-tap reply.
      await this.emailService.sendEmail({
        to: [inbox],
        template: EmailTemplate.VENDOR_LEAD_NOTIFICATION,
        // Reply goes to the vendor, not to Court+'s own inbox.
        replyTo: dto.email,
        data: {
          facilityName: dto.facilityName,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          city: dto.city,
          alreadyRegistered,
        },
      });
    } catch (error) {
      this.logger.warn(
        `[VENDOR_SIGNUP] Internal notification failed for ${dto.email}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Called when a vendor redeems their link, so the tenant starts out with the
   * details they already typed instead of asking for them twice.
   */
  async consumeForInvitation(
    invitationId: string,
    tenantId: string,
  ): Promise<VendorRegistration | null> {
    const registration = await this.registrationRepository.findOne({
      where: { invitationId },
    });
    if (!registration) return null;

    await this.registrationRepository.update(
      { id: registration.id },
      {
        status: VendorRegistrationStatus.COMPLETED,
        tenantId,
        completedAt: new Date(),
      },
    );

    return registration;
  }
}
