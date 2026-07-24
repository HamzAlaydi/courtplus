import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { AccountVerificationEmail } from 'src/emails/account-verification';
import { ForgotPasswordEmail } from 'src/emails/forgot-password';
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
import { i18next } from 'src/modules/notifications/content/i18n';

export enum EmailTemplate {
  ForgotPassword = 'forgot_password',
  AccountVerification = 'account_verification',
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
}

@Injectable()
export class EmailService {
  private readonly ses: SESv2Client;
  private readonly templateComponents: Record<EmailTemplate, any>;

  constructor(readonly configService: ConfigService) {
    this.ses = new SESv2Client({
      region: configService.get('aws.region'),
      credentials: {
        accessKeyId: configService.get('aws.accessKeyId'),
        secretAccessKey: configService.get('aws.secretAccessKey'),
      },
    });
    this.templateComponents = {
      [EmailTemplate.ForgotPassword]: ForgotPasswordEmail,
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
  }: {
    to: string[];
    subject?: string;
    template: EmailTemplate;
    data: Record<string, any>;
    language?: string;
  }) {
    const Component = this.templateComponents[template];
    const html = await render(Component(data));

    const command = new SendEmailCommand({
      FromEmailAddress: this.configService.get('aws.sesFromEmail'),
      Destination: {
        ToAddresses: to,
      },
      Content: {
        Simple: {
          Subject: {
            Charset: 'UTF-8',
            Data: subject || this.getSubject(template, language),
          },
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: html,
            },
          },
          Headers: [
            {
              Name: 'X-Entity-Ref-ID',
              Value: Date.now().toString(),
            },
          ],
        },
      },
    });

    return this.ses.send(command);
  }
}
