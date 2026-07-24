import {
  Controller,
  Post,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IsPublic } from 'src/decorators/is-public';
import { PayoutsService } from '../services/payouts.service';
import { PayoutProviderFactory } from '../providers/payout-provider.factory';
import { PayoutProvider, PayoutStatus } from '../constants/payout.constants';

@Controller('webhooks/payouts')
@ApiTags('Webhooks')
@IsPublic()
export class PayoutsWebhookController {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly providerFactory: PayoutProviderFactory,
    private readonly configService: ConfigService,
  ) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Stripe payout webhooks' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get('STRIPE_CONNECT_WEBHOOK_SECRET');

    const provider = this.providerFactory.getProvider(PayoutProvider.STRIPE);
    const isValid = provider.verifyWebhook(
      req.rawBody,
      signature,
      webhookSecret,
    );

    if (!isValid) {
      throw new UnauthorizedException('INVALID_WEBHOOK_SIGNATURE');
    }

    const { event, data } = provider.parseWebhookEvent(
      JSON.parse(req.rawBody.toString()),
    );

    switch (event) {
      case 'transfer.created':
        await this.handleTransferCreated(data);
        break;

      case 'transfer.paid':
        await this.handleTransferPaid(data);
        break;

      case 'transfer.failed':
        await this.handleTransferFailed(data);
        break;

      case 'account.updated':
        await this.handleAccountUpdated(data);
        break;
    }

    return { received: true };
  }

  private async handleTransferCreated(transfer: any): Promise<void> {
    if (transfer.metadata?.payoutId) {
      await this.payoutsService.updatePayoutStatus(
        transfer.id,
        PayoutStatus.PROCESSING,
      );
    }
  }

  private async handleTransferPaid(transfer: any): Promise<void> {
    await this.payoutsService.completePayoutFromProvider(transfer.id);
  }

  private async handleTransferFailed(transfer: any): Promise<void> {
    const failureMessage = transfer.failure_message || 'Unknown error';
    await this.payoutsService.failPayoutFromProvider(transfer.id, failureMessage);
  }

  private async handleAccountUpdated(account: any): Promise<void> {
    const tenantId = account.metadata?.tenantId;

    if (tenantId) {
      const isActive = account.charges_enabled && account.payouts_enabled;
      await this.payoutsService.updateAccountStatus(tenantId, isActive);
    }
  }
}
