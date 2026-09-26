import { Injectable, Logger } from '@nestjs/common';
import {
  CreatePayoutDto,
  IPayoutProvider,
  PayoutResult,
} from './payout-provider.interface';
import { PayoutStatus } from '../constants/payout.constants';

/**
 * Bank-transfer payouts performed by a human.
 *
 * Stripe Connect is not usable for every market: Stripe will not onboard
 * connected accounts in Saudi Arabia, and a platform account registered
 * elsewhere cannot create them cross-border either. Without an alternative,
 * vendor earnings piled up in `tenant_balances` with no way out at all.
 *
 * With this provider ops approves a payout, sends the money through their own
 * bank using the IBAN already stored on `tenant_payout_settings`, and the
 * payout is recorded as sent. Nothing is called externally, so approval
 * cannot half-succeed the way a failed API transfer can.
 */
@Injectable()
export class ManualPayoutProvider implements IPayoutProvider {
  private readonly logger = new Logger(ManualPayoutProvider.name);

  async createConnectedAccount(
    tenantId: string,
  ): Promise<{ accountId: string; onboardingUrl?: string }> {
    // There is no hosted onboarding: the vendor fills in their bank details
    // on the Settings page and ops verifies them.
    return { accountId: `manual_${tenantId}` };
  }

  async getAccountStatus(
    accountId: string,
  ): Promise<{ isActive: boolean; capabilities: string[] }> {
    return { isActive: !!accountId, capabilities: ['manual_transfer'] };
  }

  async createPayout(dto: CreatePayoutDto): Promise<PayoutResult> {
    this.logger.log(
      `Manual payout recorded for tenant ${dto.tenantId}: ${dto.amount} ${dto.currency}. Send the bank transfer, then mark it completed.`,
    );

    // PROCESSING, not COMPLETED: the money has not moved until a human sends
    // it. Ops closes the payout with POST /payouts/:id/mark-sent.
    return {
      providerPayoutId: `manual_${dto.metadata?.payoutId ?? Date.now()}`,
      status: PayoutStatus.PROCESSING,
      metadata: { manual: true, requestedAt: new Date().toISOString() },
    };
  }

  async getPayoutStatus(): Promise<PayoutStatus> {
    return PayoutStatus.PROCESSING;
  }

  async cancelPayout(providerPayoutId: string): Promise<void> {
    this.logger.log(`Manual payout ${providerPayoutId} cancelled.`);
  }

  verifyWebhook(): boolean {
    // No provider, no webhooks. Never claim a payload is authentic.
    return false;
  }

  parseWebhookEvent(): { event: string; data: any } {
    return { event: 'unsupported', data: null };
  }
}
