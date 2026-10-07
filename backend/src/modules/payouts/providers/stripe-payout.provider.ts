import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  IPayoutProvider,
  CreatePayoutDto,
  PayoutResult,
} from './payout-provider.interface';
import { PayoutStatus } from '../constants/payout.constants';
import { toStripeAmount } from 'src/common/money';

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
      // Transfers-only accounts outside the platform's country must sign the
      // recipient agreement; Stripe refuses the default (full) agreement for
      // them. It is also the agreement that keeps charges_enabled false, which
      // is why readiness is judged on payouts_enabled + transfers above.
      tos_acceptance: { service_agreement: 'recipient' },
      business_type: 'company',
      company: {
        name: businessInfo.businessName,
      },
      metadata: { tenantId },
    });

    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      // /settings is a real dashboard route; /settings/payouts/* was not, so
      // finishing Stripe Connect onboarding dropped the vendor on a blank page.
      refresh_url: `${this.configService.get('FRONTEND_URL')}/settings?payouts=refresh`,
      return_url: `${this.configService.get('FRONTEND_URL')}/settings?payouts=complete`,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  }

  async createOnboardingLink(accountId: string): Promise<string> {
    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${this.configService.get('FRONTEND_URL')}/settings?payouts=refresh`,
      return_url: `${this.configService.get('FRONTEND_URL')}/settings?payouts=complete`,
      type: 'account_onboarding',
    });
    return link.url;
  }

  async getAccountStatus(
    accountId: string,
  ): Promise<{ isActive: boolean; capabilities: string[] }> {
    const account = await this.stripe.accounts.retrieve(accountId);
    // Same rule as the account.updated webhook: transfers-only accounts never
    // get charges_enabled, so requiring it made every vendor look unready.
    return {
      isActive:
        !!account.payouts_enabled &&
        account.capabilities?.transfers === 'active',
      capabilities: Object.keys(account.capabilities || {}),
    };
  }

  async createPayout(dto: CreatePayoutDto): Promise<PayoutResult> {
    if (!dto.destinationAccount) {
      // Stripe answers this with a developer-facing message about unsetting
      // a parameter; fail before the call with something actionable.
      throw new Error('PAYOUT_ACCOUNT_NOT_CONFIGURED');
    }

    const transfer = await this.stripe.transfers.create(
      {
        // dto.amount is in MAJOR units (it comes from TenantBalance, which is
        // numeric(14,2)); Stripe expects MINOR units. Passing it through
        // unconverted transferred 1/100th of the payout — a 250.00 SAR payout
        // moved 250 halalas.
        amount: toStripeAmount(dto.amount, dto.currency),
        currency: (dto.currency || 'sar').toLowerCase(),
        destination: dto.destinationAccount,
        metadata: dto.metadata,
      },
      dto.idempotencyKey
        ? { idempotencyKey: dto.idempotencyKey }
        : undefined,
    );

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
