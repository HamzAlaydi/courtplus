import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsPublic } from 'src/decorators/is-public';
import { getIpAddress } from 'src/decorators/ip.decorator';
import { ContactService } from './contact.service';
import { ContactMessageDto } from './dto/contact-message.dto';

@Controller('contact')
@ApiTags('Contact')
@IsPublic()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Send a contact form message to the contact inbox' })
  @Throttle({
    auth: {
      generateKey(req) {
        const ip = getIpAddress(req);
        return `contact-${ip}`;
      },
    },
  })
  async sendMessage(
    @Body() dto: ContactMessageDto,
  ): Promise<{ success: boolean }> {
    await this.contactService.sendContactMessage(dto);
    return { success: true };
  }
}
