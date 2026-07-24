import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { ContactMessageDto } from './dto/contact-message.dto';

@Injectable()
export class ContactService {
  private readonly ses: SESv2Client;

  constructor(readonly configService: ConfigService) {
    this.ses = new SESv2Client({
      region: configService.get('aws.region'),
      credentials: {
        accessKeyId: configService.get('aws.accessKeyId'),
        secretAccessKey: configService.get('aws.secretAccessKey'),
      },
    });
  }

  async sendContactMessage(dto: ContactMessageDto) {
    const inbox =
      this.configService.get('aws.contactInboxEmail') ||
      this.configService.get('aws.sesFromEmail');

    const body = [
      `Name: ${dto.name}`,
      `Email: ${dto.email}`,
      '',
      dto.message,
    ].join('\n');

    const command = new SendEmailCommand({
      FromEmailAddress: this.configService.get('aws.sesFromEmail'),
      Destination: {
        ToAddresses: [inbox],
      },
      ReplyToAddresses: [dto.email],
      Content: {
        Simple: {
          Subject: {
            Charset: 'UTF-8',
            Data: dto.subject
              ? `[Court+ Contact] ${dto.subject}`
              : '[Court+ Contact] New message',
          },
          Body: {
            Text: {
              Charset: 'UTF-8',
              Data: body,
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
