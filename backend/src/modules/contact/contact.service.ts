import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../shared/services/mail.service';
import { ContactMessageDto } from './dto/contact-message.dto';

@Injectable()
export class ContactService {
  constructor(
    readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

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

    return this.mailService.sendMail({
      to: [inbox],
      subject: dto.subject
        ? `[Court+ Contact] ${dto.subject}`
        : '[Court+ Contact] New message',
      text: body,
      replyTo: dto.email,
    });
  }
}
