import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  IPayoutProvider,
  CreatePayoutDto,
  PayoutResult,
} from './payout-provider.interface';
import { PayoutStatus } from '../constants/payout.constants';

@Injectable()
export class StripePayoutProvider implements IPayoutProvider {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-04-30.basil',
    });
  }

  async createConnectedAccount(
    tenantId: string,
    businessInfo: any,
  ): Promise<{ accountId: string; onboardingUrl?: string }> {
    const account = await this.stripe.accounts.create({
      type: 'express',
      country: businessInfo.country,
      email: businessInfo.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'company',
      company: {
        name: businessInfo.businessName,
      },
      metadata: { tenantId },
    });

    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${this.configService.get('FRONTEND_URL')}/settings/payouts/refresh`,
      return_url: `${this.configService.get('FRONTEND_URL')}/settings/payouts/complete`,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  }

  async getAccountStatus(
    accountId: string,
  ): Promise<{ isActive: boolean; capabilities: string[] }> {
    const account = await this.stripe.accounts.retrieve(accountId);
    return {
      isActive: account.charges_enabled && account.payouts_enabled,
      capabilities: Object.keys(account.capabilities || {}),
    };
  }

  async createPayout(dto: CreatePayoutDto): Promise<PayoutResult> {
    const transfer = await this.stripe.transfers.create({
      amount: dto.amount,
      currency: dto.currency,
      destination: dto.destinationAccount,
      metadata: dto.metadata,
    });

    return {
      providerPayoutId: transfer.id,
      status: PayoutStatus.PROCESSING,
      metadata: { stripeTransferId: transfer.id },
    };
  }

  async getPayoutStatus(providerPayoutId: string): Promise<PayoutStatus> {
    const transfer = await this.stripe.transfers.retrieve(providerPayoutId);
    return transfer.reversed ? PayoutStatus.FAILED : PayoutStatus.COMPLETED;
  }

  async cancelPayout(providerPayoutId: string): Promise<void> {
    await this.stripe.transfers.createReversal(providerPayoutId);
  }

  verifyWebhook(payload: any, signature: string, secret: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (err) {
      return false;
    }
  }

  parseWebhookEvent(payload: any): { event: string; data: any } {
    return {
      event: payload.type,
      data: payload.data.object,
    };
  }

  private mapStripeStatus(stripeStatus: string): PayoutStatus {
    switch (stripeStatus) {
      case 'pending':
        return PayoutStatus.PROCESSING;
      case 'paid':
        return PayoutStatus.COMPLETED;
      case 'failed':
        return PayoutStatus.FAILED;
      case 'canceled':
        return PayoutStatus.CANCELLED;
      default:
        return PayoutStatus.PENDING;
    }
  }
}
