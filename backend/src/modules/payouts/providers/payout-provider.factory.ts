import { Injectable } from '@nestjs/common';
import { PayoutProvider } from '../constants/payout.constants';
import { IPayoutProvider } from './payout-provider.interface';
import { StripePayoutProvider } from './stripe-payout.provider';
import { ManualPayoutProvider } from './manual-payout.provider';

@Injectable()
export class PayoutProviderFactory {
  constructor(
    private readonly stripePayoutProvider: StripePayoutProvider,
    private readonly manualPayoutProvider: ManualPayoutProvider,
  ) {}

  getProvider(provider: PayoutProvider): IPayoutProvider {
    switch (provider) {
      case PayoutProvider.STRIPE:
        return this.stripePayoutProvider;
      // Bank transfer sent by ops. Previously this threw, so a tenant set to
      // CUSTOM could never be paid at all.
      case PayoutProvider.CUSTOM:
        return this.manualPayoutProvider;
      default:
        throw new Error(`Unsupported payout provider: ${provider}`);
    }
  }
}
