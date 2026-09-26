import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsPublic } from 'src/decorators/is-public';
import { getIpAddress } from 'src/decorators/ip.decorator';
import { VendorsService } from './vendors.service';
import { VendorRegisterDto } from './dto/vendor-register.dto';

@Controller('vendors')
@ApiTags('Vendors')
@IsPublic()
@UseGuards(ThrottlerGuard)
@SkipThrottle({ phone: true })
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Register a facility from the marketing site and email the owner a link to finish setting up in the vendor portal',
  })
  @ApiResponse({
    status: 200,
    description:
      'Always returns success, whether or not a link was sent, so the endpoint cannot be used to discover which emails have accounts',
  })
  @Throttle({
    auth: {
      generateKey(req) {
        const ip = getIpAddress(req);
        return `vendor-register-${ip}`;
      },
    },
  })
  async register(@Body() dto: VendorRegisterDto): Promise<{ success: boolean }> {
    await this.vendorsService.register(dto);
    // Deliberately identical for new and existing emails — see
    // VendorsService.register.
    return { success: true };
  }
}
