import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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

export interface PlanPricing {
  baseAmountCents: number;
  addonAmountCents: number;
  currency: string;
}

@Injectable()
export class PricingService implements OnModuleInit {
  private readonly logger = new Logger(PricingService.name);

  /**
   * Live copy of the Stripe Price objects, refreshed hourly.
   *
   * PRICING is what the code assumes; the Stripe prices are what the card is
   * actually charged. Every quoted figure (overview, next invoice, add-court
   * confirmation) used the constants, so an edit to a price in the Stripe
   * dashboard silently made the app quote the wrong number. Live amounts win
   * and a mismatch is logged for ops.
   */
  private livePricing: PlanPricing | null = null;

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

  onModuleInit(): void {
    // Not awaited: boot must not wait on Stripe. Constants apply until then.
    void this.refreshLivePricing();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async refreshLivePricing(): Promise<void> {
    const baseId = this.configService.get('stripe.branchPriceId');
    const branchAddonId = this.configService.get('stripe.branchAddonPriceId');
    const courtAddonId = this.configService.get('stripe.courtAddonPriceId');
    if (!baseId || !branchAddonId || !courtAddonId) {
      return;
    }
    try {
      const [base, branchAddon, courtAddon] = await Promise.all([
        this.paymentsService.retrievePrice(baseId),
        this.paymentsService.retrievePrice(branchAddonId),
        this.paymentsService.retrievePrice(courtAddonId),
      ]);
      const prices = { base, branchAddon, courtAddon };
      for (const [name, price] of Object.entries(prices)) {
        if (
          !price.active ||
          price.recurring?.interval !== 'month' ||
          typeof price.unit_amount !== 'number'
        ) {
          this.logger.error(
            `[BILLING] Stripe price ${name} (${price.id}) is not an active monthly unit price — quoting PRICING constants instead`,
          );
          return;
        }
      }
      if (
        branchAddon.unit_amount !== courtAddon.unit_amount ||
        new Set([base.currency, branchAddon.currency, courtAddon.currency]).size !== 1
      ) {
        this.logger.error(
          `[BILLING] Stripe add-on prices disagree (branch ${branchAddon.unit_amount} ${branchAddon.currency}, court ${courtAddon.unit_amount} ${courtAddon.currency}, base ${base.currency}); the app assumes one add-on rate in one currency`,
        );
      }
      this.livePricing = {
        baseAmountCents: base.unit_amount,
        addonAmountCents: courtAddon.unit_amount,
        currency: base.currency,
      };
      if (
        base.unit_amount !== PRICING.BASE_AMOUNT_CENTS ||
        courtAddon.unit_amount !== PRICING.ADDON_AMOUNT_CENTS ||
        base.currency !== PRICING.CURRENCY
      ) {
        this.logger.error(
          `[BILLING] Stripe prices (${base.unit_amount}/${courtAddon.unit_amount} ${base.currency}) differ from PRICING constants (${PRICING.BASE_AMOUNT_CENTS}/${PRICING.ADDON_AMOUNT_CENTS} ${PRICING.CURRENCY}); live values are being quoted — align the constants`,
        );
      }
    } catch (error) {
      this.logger.error(
        '[BILLING] Could not load Stripe prices; quoting PRICING constants',
        error as Error,
      );
    }
  }

  /** Amounts to quote: live Stripe prices when loaded, else the constants. */
  getPricing(): PlanPricing {
    return (
      this.livePricing ?? {
        baseAmountCents: PRICING.BASE_AMOUNT_CENTS,
        addonAmountCents: PRICING.ADDON_AMOUNT_CENTS,
        currency: PRICING.CURRENCY,
      }
    );
  }

  /**
   * Base $30/mo includes 1 branch + 2 courts. Every extra branch is
   * $10/mo (1 court included per extra branch). Every court beyond the
   * included units is $10/mo.
   */
  computeBreakdown(branchCount: number, courtCount: number): PricingBreakdown {
    const pricing = this.getPricing();
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
        pricing.baseAmountCents + billableAddons * pricing.addonAmountCents,
      currency: pricing.currency,
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
   * Line items for the first Checkout: the same base + add-on shape that
   * doSyncTenantSubscription maintains afterwards, so the subscription is
   * born with the tenant's real unit counts instead of the base plan alone.
   */
  buildCheckoutLineItems(
    breakdown: PricingBreakdown,
  ): Array<{ price: string; quantity: number }> {
    const basePriceId = this.configService.get('stripe.branchPriceId');
    const branchAddonPriceId = this.configService.get(
      'stripe.branchAddonPriceId',
    );
    const courtAddonPriceId = this.configService.get('stripe.courtAddonPriceId');

    const items = [{ price: basePriceId, quantity: 1 }];
    if (breakdown.branchAddons > 0) {
      items.push({ price: branchAddonPriceId, quantity: breakdown.branchAddons });
    }
    if (breakdown.courtAddons > 0) {
      items.push({ price: courtAddonPriceId, quantity: breakdown.courtAddons });
    }
    return items;
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
