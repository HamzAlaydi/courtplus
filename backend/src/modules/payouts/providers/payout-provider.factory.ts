import { Injectable } from '@nestjs/common';
import { PayoutProvider } from '../constants/payout.constants';
import { IPayoutProvider } from './payout-provider.interface';
import { StripePayoutProvider } from './stripe-payout.provider';

@Injectable()
export class PayoutProviderFactory {
  constructor(private readonly stripePayoutProvider: StripePayoutProvider) {}

  getProvider(provider: PayoutProvider): IPayoutProvider {
    switch (provider) {
      case PayoutProvider.STRIPE:
        return this.stripePayoutProvider;
      default:
        throw new Error(`Unsupported payout provider: ${provider}`);
    }
  }
}
