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
import { PayoutProvider } from '../constants/payout.constants';
import { WebhookIdempotencyService } from 'src/modules/payments/webhook-idempotency.service';

@Controller('webhooks/payouts')
@ApiTags('Webhooks')
@IsPublic()
export class PayoutsWebhookController {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly providerFactory: PayoutProviderFactory,
    private readonly configService: ConfigService,
    private readonly idempotency: WebhookIdempotencyService,
  ) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Stripe payout webhooks' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    // transfer.* are PLATFORM-account events; account.updated for a vendor's
    // Express account is a CONNECT event. In the Stripe dashboard those are
    // two endpoints (same URL, two signing secrets). Verifying against the
    // Connect secret alone silently rejected every transfer event, so payouts
    // never left PROCESSING. Accept whichever configured secret signed it.
    const secrets = [
      this.configService.get<string>('STRIPE_CONNECT_WEBHOOK_SECRET'),
      this.configService.get<string>('STRIPE_PAYOUTS_WEBHOOK_SECRET'),
      this.configService.get<string>('stripe.webhookSecret'),
    ].filter((secret, index, all) => !!secret && all.indexOf(secret) === index);

    const provider = this.providerFactory.getProvider(PayoutProvider.STRIPE);
    const isValid = secrets.some((secret) =>
      provider.verifyWebhook(req.rawBody, signature, secret),
    );

    if (!isValid) {
      throw new UnauthorizedException('INVALID_WEBHOOK_SIGNATURE');
    }

    const rawEvent = JSON.parse(req.rawBody.toString());

    // Stripe retries for up to three days on any non-2xx. Without this, a
    // replayed transfer event credits the tenant's balance a second time.
    if (await this.idempotency.alreadyProcessed(rawEvent, 'payouts')) {
      return { received: true };
    }

    const { event, data } = provider.parseWebhookEvent(rawEvent);

    try {
    // Stripe's transfer lifecycle is transfer.created / transfer.updated /
    // transfer.reversed. There is no transfer.paid or transfer.failed — the
    // previous cases for those never fired, so every payout stayed PROCESSING
    // forever and the vendor's balance ledger never closed. A transfer to a
    // connected account is final the moment it is created; the only later
    // failure mode is a reversal.
    switch (event) {
      case 'transfer.created':
        await this.handleTransferCreated(data);
        break;

      case 'transfer.reversed':
        await this.handleTransferReversed(data);
        break;

      case 'account.updated':
        await this.handleAccountUpdated(data);
        break;
    }
    } catch (error) {
      // Release the claim so Stripe's retry is not deduped away.
      await this.idempotency.release(rawEvent?.id);
      throw error;
    }

    return { received: true };
  }

  private async handleTransferCreated(transfer: any): Promise<void> {
    // Only transfers this app created carry our payoutId; ignore anything
    // else moving through the platform account.
    if (!transfer.metadata?.payoutId) {
      return;
    }
    if (transfer.reversed) {
      await this.handleTransferReversed(transfer);
      return;
    }
    await this.payoutsService.completePayoutFromProvider(transfer.id);
  }

  private async handleTransferReversed(transfer: any): Promise<void> {
    if (!transfer.metadata?.payoutId) {
      return;
    }
    await this.payoutsService.failPayoutFromProvider(
      transfer.id,
      'Transfer reversed by Stripe',
    );
  }

  private async handleAccountUpdated(account: any): Promise<void> {
    const tenantId = account.metadata?.tenantId;

    if (tenantId) {
      // Express accounts here request only the `transfers` capability, so
      // `charges_enabled` is false by design and the old
      // `charges_enabled && payouts_enabled` check could never become true —
      // no vendor was ever marked payout-ready. Ready means Stripe will pay
      // the account out AND the transfers capability is live.
      const isActive =
        !!account.payouts_enabled &&
        account.capabilities?.transfers === 'active';
      await this.payoutsService.updateAccountStatus(tenantId, isActive);
    }
  }
}
