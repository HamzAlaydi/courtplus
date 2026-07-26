import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type { Stripe } from 'stripe';

import { Branch } from '../branches/entities/branch.entity';
import { Court } from '../courts/entities/court.entity';
import { Subscription } from './entities/subscription.entity';
import { PaymentsService } from '../payments/payments.service';

export const PRICING = {
  BASE_AMOUNT_CENTS: 3000,
  ADDON_AMOUNT_CENTS: 1000,
  INCLUDED_BRANCHES: 1,
  INCLUDED_COURTS_BASE: 2,
  INCLUDED_COURTS_PER_EXTRA_BRANCH: 1,
  CURRENCY: 'usd',
} as const;

export interface PricingBreakdown {
  branchCount: number;
  courtCount: number;
  includedCourts: number;
  branchAddons: number;
  courtAddons: number;
  billableAddons: number;
  monthlyAmountCents: number;
  currency: string;
}

export type SyncDirection = 'increased' | 'decreased' | 'unchanged';

export interface SubscriptionSyncResult {
  breakdown: PricingBreakdown;
  direction: SyncDirection;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  private readonly runningSyncs = new Map<
    string,
    Promise<SubscriptionSyncResult>
  >();
  private readonly queuedSyncs = new Map<
    string,
    Promise<SubscriptionSyncResult>
  >();

  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Base $30/mo includes 1 branch + 2 courts. Every extra branch is
   * $10/mo (1 court included per extra branch). Every court beyond the
   * included units is $10/mo.
   */
  computeBreakdown(branchCount: number, courtCount: number): PricingBreakdown {
    const branchAddons = Math.max(0, branchCount - PRICING.INCLUDED_BRANCHES);
    const includedCourts =
      branchCount === 0
        ? 0
        : PRICING.INCLUDED_COURTS_BASE +
        branchAddons * PRICING.INCLUDED_COURTS_PER_EXTRA_BRANCH;
    const courtAddons = Math.max(0, courtCount - includedCourts);
    const billableAddons = branchAddons + courtAddons;

    return {
      branchCount,
      courtCount,
      includedCourts,
      branchAddons,
      courtAddons,
      billableAddons,
      monthlyAmountCents:
        PRICING.BASE_AMOUNT_CENTS +
        billableAddons * PRICING.ADDON_AMOUNT_CENTS,
      currency: PRICING.CURRENCY,
    };
  }

  async getTenantCounts(
    tenantId: string,
  ): Promise<{ branchCount: number; courtCount: number }> {
    const [branchCount, courtCount] = await Promise.all([
      this.branchRepository.count({
        where: { tenantId, deletedAt: IsNull() },
      }),
      this.courtRepository.count({
        where: { deletedAt: IsNull(), branch: { tenantId } },
      }),
    ]);
    return { branchCount, courtCount };
  }

  async computeTenantBreakdown(tenantId: string): Promise<PricingBreakdown> {
    const { branchCount, courtCount } = await this.getTenantCounts(tenantId);
    return this.computeBreakdown(branchCount, courtCount);
  }

  /**
   * Serializes per-tenant syncs: concurrent branch/court unit-change events
   * for the same tenant run one after another, each reading fresh counts.
   * While a sync is in flight at most one follow-up is queued — it reads
   * fresh counts, so a single extra run covers every change queued behind
   * it (callers that arrive while the follow-up is queued simply join it).
   */
  async syncTenantSubscription(
    subscription: Subscription,
  ): Promise<SubscriptionSyncResult> {
    const tenantId = subscription.tenantId;

    const running = this.runningSyncs.get(tenantId);
    if (!running) {
      const run = this.doSyncTenantSubscription(subscription).finally(() => {
        this.runningSyncs.delete(tenantId);
      });
      this.runningSyncs.set(tenantId, run);
      return run;
    }

    let queued = this.queuedSyncs.get(tenantId);
    if (!queued) {
      queued = running
        .catch(() => undefined)
        .then(() => {
          // The follow-up starts here: late arrivals must queue a new one
          // because this run may have already read its counts.
          this.queuedSyncs.delete(tenantId);
          return this.syncTenantSubscription(subscription);
        });
      this.queuedSyncs.set(tenantId, queued);
    }
    return queued;
  }

  /**
   * Recomputes the tenant's billable units from the actual branch/court
   * counts and syncs the Stripe subscription items:
   * base (qty 1) + branch_addon (qty) + court_addon (qty).
   * Upgrades are invoiced immediately (always_invoice) so the
   * invoice.paid webhook can gate court approval; downgrades are
   * deferred to the next period (no proration credit).
   */
  private async doSyncTenantSubscription(
    subscription: Subscription,
  ): Promise<SubscriptionSyncResult> {
    const breakdown = await this.computeTenantBreakdown(subscription.tenantId);

    subscription.quantity = breakdown.branchCount;
    subscription.metadata = {
      ...subscription.metadata,
      breakdown,
    };
    await this.subscriptionRepository.save(subscription);

    if (!subscription.providerSubscriptionId) {
      return { breakdown, direction: 'unchanged' };
    }

    const basePriceId = this.configService.get('stripe.branchPriceId');
    const branchAddonPriceId = this.configService.get(
      'stripe.branchAddonPriceId',
    );
    const courtAddonPriceId = this.configService.get('stripe.courtAddonPriceId');

    const stripeSubscription = await this.paymentsService.retrieveSubscription(
      subscription.providerSubscriptionId,
    );

    const itemsByPrice = new Map<string, Stripe.SubscriptionItem>();
    for (const item of stripeSubscription.items.data) {
      const priceId = typeof item.price === 'string' ? item.price : item.price?.id;
      if (priceId) {
        itemsByPrice.set(priceId, item);
      }
    }

    const desired: Array<{
      priceId: string;
      quantity: number;
      required: boolean;
    }> = [
        { priceId: basePriceId, quantity: 1, required: true },
        {
          priceId: branchAddonPriceId,
          quantity: breakdown.branchAddons,
          required: false,
        },
        {
          priceId: courtAddonPriceId,
          quantity: breakdown.courtAddons,
          required: false,
        },
      ];

    const itemUpdates: Stripe.SubscriptionUpdateParams.Item[] = [];
    let direction: SyncDirection = 'unchanged';

    for (const { priceId, quantity, required } of desired) {
      if (!priceId) {
        this.logger.warn(
          `Missing Stripe price id configuration; skipping item sync (required: ${required})`,
        );
        continue;
      }
      const existing = itemsByPrice.get(priceId);
      if (!existing) {
        if (quantity > 0 || required) {
          itemUpdates.push({ price: priceId, quantity });
          if (quantity > 0) {
            direction = 'increased';
          }
        }
        continue;
      }
      if (quantity === 0 && !required) {
        itemUpdates.push({ id: existing.id, deleted: true });
        if (direction !== 'increased') {
          direction = 'decreased';
        }
      } else if (existing.quantity !== quantity) {
        itemUpdates.push({ id: existing.id, quantity });
        direction =
          existing.quantity < quantity
            ? 'increased'
            : direction === 'increased'
              ? 'increased'
              : 'decreased';
      }
    }

    if (itemUpdates.length > 0) {
      await this.paymentsService.updateSubscriptionItems(
        subscription.providerSubscriptionId,
        itemUpdates,
        direction === 'decreased' ? 'none' : 'always_invoice',
      );
    }

    return { breakdown, direction };
  }
}
