import { PayoutStatus, PayoutProvider } from '../constants/payout.constants';

export interface PayoutProviderConfig {
  provider: PayoutProvider;
  credentials: Record<string, any>;
}

export interface CreatePayoutDto {
  tenantId: string;
  amount: number;
  currency: string;
  destinationAccount: string;
  metadata?: Record<string, any>;
  /**
   * Stable key so a retried approval returns the ORIGINAL transfer instead
   * of sending the vendor a second one.
   */
  idempotencyKey?: string;
}

export interface PayoutResult {
  providerPayoutId: string;
  status: PayoutStatus;
  estimatedArrival?: Date;
  metadata?: Record<string, any>;
}

export interface IPayoutProvider {
  createConnectedAccount(
    tenantId: string,
    businessInfo: any,
  ): Promise<{ accountId: string; onboardingUrl?: string }>;

  getAccountStatus(
    accountId: string,
  ): Promise<{ isActive: boolean; capabilities: string[] }>;

  /** A fresh onboarding link for an account that has not finished onboarding. */
  createOnboardingLink?(accountId: string): Promise<string>;

  createPayout(dto: CreatePayoutDto): Promise<PayoutResult>;

  getPayoutStatus(providerPayoutId: string): Promise<PayoutStatus>;

  cancelPayout(providerPayoutId: string): Promise<void>;

  verifyWebhook(payload: any, signature: string, secret: string): boolean;

  parseWebhookEvent(payload: any): { event: string; data: any };
}
