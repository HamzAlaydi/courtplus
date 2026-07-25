import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsPublic } from 'src/decorators/is-public';
import { getIpAddress } from 'src/decorators/ip.decorator';
import { ContactService } from './contact.service';
import { ContactMessageDto } from './dto/contact-message.dto';

@Controller('contact')
@ApiTags('Contact')
@IsPublic()
@UseGuards(ThrottlerGuard)
@SkipThrottle({ phone: true })
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
