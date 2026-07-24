import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESv2Client,
  SendEmailCommand,
  SendEmailCommandInput,
} from '@aws-sdk/client-sesv2';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

/**
 * Unified outbound email. Driver is chosen by MAIL_DRIVER env:
 *  - 'smtp' (default while SES is in sandbox): Gmail SMTP via nodemailer,
 *    sends to any recipient immediately.
 *  - 'ses': AWS SES v2, used in production once SES gets production access.
 */
@Injectable()
export class MailService {
  private readonly ses: SESv2Client;
  private readonly transporter?: nodemailer.Transporter;
  private readonly driver: string;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.driver = configService.get('mail.driver') || 'ses';
    this.from = configService.get('aws.sesFromEmail');
    this.ses = new SESv2Client({
      region: configService.get('aws.region'),
      credentials: {
        accessKeyId: configService.get('aws.accessKeyId'),
        secretAccessKey: configService.get('aws.secretAccessKey'),
      },
    });
    const user = configService.get('mail.smtpUser');
    const pass = configService.get('mail.smtpPass');
    if (this.driver === 'smtp' && user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }

  async sendMail({ to, subject, html, text, replyTo }: SendMailOptions) {
    if (this.driver === 'smtp') {
      if (!this.transporter) {
        throw new Error(
          'MAIL_DRIVER=smtp but SMTP_USER/SMTP_PASS are not configured',
        );
      }
      return this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text,
        replyTo,
      });
    }

    const input: SendEmailCommandInput = {
      FromEmailAddress: this.from,
      Destination: { ToAddresses: to },
      ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
      Content: {
        Simple: {
          Subject: { Charset: 'UTF-8', Data: subject },
          Body: {
            ...(html ? { Html: { Charset: 'UTF-8', Data: html } } : {}),
            ...(text ? { Text: { Charset: 'UTF-8', Data: text } } : {}),
          },
        },
      },
    };
    return this.ses.send(new SendEmailCommand(input));
  }
}
