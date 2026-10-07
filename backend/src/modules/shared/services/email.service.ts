import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import { MailService } from './mail.service';
import { AccountVerificationEmail } from 'src/emails/account-verification';
import { ForgotPasswordEmail } from 'src/emails/forgot-password';
import { AccountDeletionEmail } from 'src/emails/account-deletion';
import { BookingCreatedEmail } from 'src/emails/staff-booking-created';
import { BookingReminderEmail } from 'src/emails/staff-booking-reminder';
import { BookingCancellationEmail } from 'src/emails/staff-booking-cancelled';
import { ReviewAddedEmail } from 'src/emails/review-added';
import { EmailVerificationEmail } from 'src/emails/email-verification';
import { StaffInvitationEmail } from 'src/emails/staff-invitation';
import { BookingInvitationEmail } from 'src/emails/booking-invitation';
import { BookingReminderParticipantEmail } from 'src/emails/booking-reminder-participant';
import { BookingCancelledParticipantEmail } from 'src/emails/booking-cancelled-participant';
import { BookingJoinRequestSubmittedEmail } from 'src/emails/booking-join-request-submitted';
import { BookingJoinRequestApprovedEmail } from 'src/emails/booking-join-request-approved';
import { BookingJoinRequestRejectedEmail } from 'src/emails/booking-join-request-rejected';
import { BookingInvitationAcceptedEmail } from 'src/emails/booking-invitation-accepted';
import { BookingInvitationRejectedEmail } from 'src/emails/booking-invitation-rejected';
import { CourtApprovedEmail } from 'src/emails/court-approved';
import { CourtChangesRequestedEmail } from 'src/emails/court-changes-requested';
import { ResourceSuspendedEmail } from 'src/emails/resource-suspended';
import { CourtPaymentPendingEmail } from 'src/emails/court-payment-pending';
import { i18next } from 'src/modules/notifications/content/i18n';
import { VendorRegistrationEmail } from 'src/emails/vendor-registration';
import { VendorLeadNotificationEmail } from 'src/emails/vendor-lead-notification';
import { VendorAccountExistsEmail } from 'src/emails/vendor-account-exists';
import { BookingConfirmedEmail } from 'src/emails/booking-confirmed';
import { SubscriptionPaymentFailedEmail } from 'src/emails/subscription-payment-failed';
import { PayoutFailedEmail } from 'src/emails/payout-failed';

export enum EmailTemplate {
  ForgotPassword = 'forgot_password',
  AccountVerification = 'account_verification',
  AccountDeletion = 'account_deletion',
  EmailVerification = 'email_verification',
  STAFF_BOOKING_CREATED = 'staff_booking_created',
  STAFF_BOOKING_REMINDER = 'staff_booking_reminder',
  STAFF_BOOKING_CANCELLED = 'staff_booking_cancelled',
  REVIEW_ADDED = 'review_added',
  STAFF_INVITATION = 'staff_invitation',
  BOOKING_INVITATION = 'booking_invitation',
  BOOKING_REMINDER_PARTICIPANT = 'booking_reminder_participant',
  BOOKING_CANCELLED_PARTICIPANT = 'booking_cancelled_participant',
  BOOKING_JOIN_REQUEST_SUBMITTED = 'booking_join_request_submitted',
  BOOKING_JOIN_REQUEST_APPROVED = 'booking_join_request_approved',
  BOOKING_JOIN_REQUEST_REJECTED = 'booking_join_request_rejected',
  BOOKING_INVITATION_ACCEPTED = 'booking_invitation_accepted',
  BOOKING_INVITATION_REJECTED = 'booking_invitation_rejected',
  COURT_APPROVED = 'court_approved',
  COURT_CHANGES_REQUESTED = 'court_changes_requested',
  RESOURCE_SUSPENDED = 'resource_suspended',
  COURT_PENDING_PAYMENT = 'court_pending_payment',
  VENDOR_REGISTRATION = 'vendor_registration',
  VENDOR_LEAD_NOTIFICATION = 'vendor_lead_notification',
  VENDOR_ACCOUNT_EXISTS = 'vendor_account_exists',
  // The receipt the paying customer gets; the venue's copy is
  // STAFF_BOOKING_CREATED above and says different things.
  BOOKING_CONFIRMED = 'booking_confirmed',
  SUBSCRIPTION_PAYMENT_FAILED = 'subscription_payment_failed',
  PAYOUT_FAILED = 'payout_failed',
}

@Injectable()
export class EmailService {
  private readonly templateComponents: Record<EmailTemplate, any>;

  constructor(
    readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.templateComponents = {
      [EmailTemplate.ForgotPassword]: ForgotPasswordEmail,
      [EmailTemplate.AccountDeletion]: AccountDeletionEmail,
      [EmailTemplate.AccountVerification]: AccountVerificationEmail,
      [EmailTemplate.STAFF_BOOKING_CREATED]: BookingCreatedEmail,
      [EmailTemplate.STAFF_BOOKING_REMINDER]: BookingReminderEmail,
      [EmailTemplate.STAFF_BOOKING_CANCELLED]: BookingCancellationEmail,
      [EmailTemplate.REVIEW_ADDED]: ReviewAddedEmail,
      [EmailTemplate.EmailVerification]: EmailVerificationEmail,
      [EmailTemplate.STAFF_INVITATION]: StaffInvitationEmail,
      [EmailTemplate.BOOKING_INVITATION]: BookingInvitationEmail,
      [EmailTemplate.BOOKING_REMINDER_PARTICIPANT]: BookingReminderParticipantEmail,
      [EmailTemplate.BOOKING_CANCELLED_PARTICIPANT]: BookingCancelledParticipantEmail,
      [EmailTemplate.BOOKING_JOIN_REQUEST_SUBMITTED]: BookingJoinRequestSubmittedEmail,
      [EmailTemplate.BOOKING_JOIN_REQUEST_APPROVED]: BookingJoinRequestApprovedEmail,
      [EmailTemplate.BOOKING_JOIN_REQUEST_REJECTED]: BookingJoinRequestRejectedEmail,
      [EmailTemplate.BOOKING_INVITATION_ACCEPTED]: BookingInvitationAcceptedEmail,
      [EmailTemplate.BOOKING_INVITATION_REJECTED]: BookingInvitationRejectedEmail,
      [EmailTemplate.COURT_APPROVED]: CourtApprovedEmail,
      [EmailTemplate.COURT_CHANGES_REQUESTED]: CourtChangesRequestedEmail,
      [EmailTemplate.RESOURCE_SUSPENDED]: ResourceSuspendedEmail,
      [EmailTemplate.COURT_PENDING_PAYMENT]: CourtPaymentPendingEmail,
      [EmailTemplate.VENDOR_REGISTRATION]: VendorRegistrationEmail,
      [EmailTemplate.VENDOR_LEAD_NOTIFICATION]: VendorLeadNotificationEmail,
      [EmailTemplate.VENDOR_ACCOUNT_EXISTS]: VendorAccountExistsEmail,
      [EmailTemplate.BOOKING_CONFIRMED]: BookingConfirmedEmail,
      [EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED]: SubscriptionPaymentFailedEmail,
      [EmailTemplate.PAYOUT_FAILED]: PayoutFailedEmail,
    };
  }

  private getSubject(template: EmailTemplate, language: string = 'en'): string {
    return i18next.t(`emails.${template}`, {
      lng: language,
    });
  }

  async sendEmail({
    data,
    to,
    subject,
    template,
    language = 'en',
    replyTo,
  }: {
    to: string[];
    subject?: string;
    template: EmailTemplate;
    data: Record<string, any>;
    language?: string;
    /**
     * Address replies should go to, when that differs from the sender —
     * e.g. an internal lead notification where the team replies to the vendor.
     */
    replyTo?: string;
  }) {
    const Component = this.templateComponents[template];
    const html = await render(Component(data));

    return this.mailService.sendMail({
      to,
      subject: subject || this.getSubject(template, language),
      html,
      replyTo,
    });
  }
}
