import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';

import { SubscriptionsService } from './subscriptions.service';
import { PaymentsService } from '../payments/payments.service';
import {
  CreateCheckoutSessionDto,
  CheckoutSessionResponseDto,
  BranchAvailabilityResponseDto,
  CourtAvailabilityResponseDto,
} from './dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { SessionUser } from '../auth/@types/session';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { StaffRole } from '../staff/entities/enum';
import { IsPublic } from 'src/decorators/is-public';
import { Subscription } from './entities/subscription.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserTypeGuard } from '../auth/guards/user-type.guard';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AuthorizedUserType.isStaff([StaffRole.OWNER])
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) { }


  @Get()
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  @ApiOperation({ summary: 'Get current tenant subscription' })
  @ApiResponse({ status: 200, type: Subscription })
  async getCurrentSubscription(
    @CurrentUser() user: SessionUser,
  ): Promise<Subscription | null> {
    return this.subscriptionsService.getCurrentSubscription(
      user.tenantId,
    );

  }

  @Post('portal')
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
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

  @Post('cancel')
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, type: Subscription })
  async cancelSubscription(
    @CurrentUser() user: SessionUser,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionsService.cancelSubscription(
      user.tenantId,
    );
    return subscription;
  }

  @Post('checkout')
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  @ApiOperation({ summary: 'Create Stripe checkout session for subscription' })
  @ApiResponse({ status: 200, type: CheckoutSessionResponseDto })
  async createCheckoutSession(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    return this.subscriptionsService.createCheckoutSession(
      user.tenantId,
      dto.branchCount,
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  @Get('branch-availability')
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  @ApiOperation({ summary: 'Check if tenant can create new branch' })
  @ApiResponse({ status: 200, type: BranchAvailabilityResponseDto })
  async getBranchAvailability(
    @CurrentUser() user: SessionUser,
  ): Promise<BranchAvailabilityResponseDto> {
    return this.subscriptionsService.getBranchAvailability(user.tenantId);
  }

  @Get('court-availability')
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  @ApiOperation({ summary: 'Check if tenant can create new court' })
  @ApiResponse({ status: 200, type: CourtAvailabilityResponseDto })
  async getCourtAvailability(
    @CurrentUser() user: SessionUser,
  ): Promise<CourtAvailabilityResponseDto> {
    return this.subscriptionsService.getCourtAvailability(user.tenantId);
  }

  @Post('webhook')
  @IsPublic()
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    const event = await this.paymentsService.constructWebhookEvent(
      req,
      this.configService.get('stripe.subscriptionsWebhookSecret'),
    );

    switch (event.type) {
      case 'customer.subscription.created':
        await this.subscriptionsService.handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.updated':
        await this.subscriptionsService.handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await this.subscriptionsService.handleSubscriptionDeleted(event);
        break;
      case 'invoice.paid':
        await this.subscriptionsService.handleInvoicePaid(event);
        break;
      case 'invoice.payment_failed':
        await this.subscriptionsService.handleInvoicePaymentFailed(event);
        break;

      case 'checkout.session.completed':
        await this.subscriptionsService.handleCheckoutSessionCompleted(event);
        break;
    }

    return { received: true };
  }


}
