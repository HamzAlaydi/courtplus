import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { SubscriptionsService } from './subscriptions.service';
import {
  BillingOverviewResponseDto,
  BillingInvoiceDto,
  PendingChargesResponseDto,
} from './dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { SessionUser } from '../auth/@types/session';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { StaffRole } from '../staff/entities/enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { Audited } from 'src/decorators/audited.decorator';
import { LogAction, LogEntity } from '../logging/entities/log.entity';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AuthorizedUserType.isStaff([StaffRole.OWNER])
export class BillingController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) { }

  @Get('overview')
  @ApiOperation({
    summary: 'Get billing overview',
    description:
      'Returns the current plan breakdown (base + add-ons with quantities) and the expected next invoice amount.',
  })
  @ApiResponse({ status: 200, type: BillingOverviewResponseDto })
  async getOverview(
    @CurrentUser() user: SessionUser,
  ): Promise<BillingOverviewResponseDto> {
    return this.subscriptionsService.getBillingOverview(user.tenantId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List Stripe invoices for the tenant' })
  @ApiResponse({ status: 200, type: [BillingInvoiceDto] })
  async getInvoices(
    @CurrentUser() user: SessionUser,
  ): Promise<BillingInvoiceDto[]> {
    return this.subscriptionsService.getBillingInvoices(user.tenantId);
  }

  @Post('portal')
  @Audited(LogEntity.SUBSCRIPTION, LogAction.UPDATE)
  @ApiOperation({ summary: 'Get Stripe billing portal URL' })
  @ApiResponse({
    status: 200,
    schema: { properties: { url: { type: 'string' } } },
  })
  async createPortalSession(
    @CurrentUser() user: SessionUser,
    @Body('returnUrl') returnUrl?: string,
  ): Promise<{ url: string }> {
    const defaultReturnUrl = `${this.configService.get('app.frontendUrl')}`;
    return this.subscriptionsService.createBillingPortalSession(
      user.tenantId,
      returnUrl || defaultReturnUrl,
    );
  }

  @Get('pending-charges')
  @ApiOperation({
    summary: 'Get pending court charges',
    description:
      'Returns the courts that are waiting for payment before they can be reviewed.',
  })
  @ApiResponse({ status: 200, type: PendingChargesResponseDto })
  async getPendingCharges(
    @CurrentUser() user: SessionUser,
  ): Promise<PendingChargesResponseDto> {
    return this.subscriptionsService.getPendingCharges(user.tenantId);
  }
}
