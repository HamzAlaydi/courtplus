import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { dayjs } from '../shared/dayjs';
import type { SubscriptionPaymentFailedEmailProps } from 'src/emails/subscription-payment-failed';
import { DistributedLockService } from 'src/common/distributed-lock.service';
import type { Stripe } from 'stripe';

import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus } from './entities/enums';
import {
  BranchAvailabilityResponseDto,
  CourtAvailabilityResponseDto,
  CheckoutSessionResponseDto,
  BillingOverviewResponseDto,
  BillingInvoiceDto,
  PendingChargesResponseDto,
} from './dto';
import { PaymentsService } from '../payments/payments.service';
import { TenantsService } from '../tenants/tenants.service';
import { BranchesService } from '../branches/branches.service';
import {
  SubscriptionEvents,
  SubscriptionCancelledPayload,
} from './subscriptions.events';
import * as ErrorCodes from '../shared/error-codes';
import { BranchEvent, BranchEventPayload } from '../branches/branch.events';
import { CourtEvent, CourtEventPayload } from '../courts/courts.events';
import { CourtsService } from '../courts/courts.service';
import { Court } from '../courts/entities/court.entity';
import { PricingService, PRICING, PricingBreakdown } from './pricing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StaffService } from '../staff/staff.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import {
  getInvoiceSubscriptionId,
  getSubscriptionPeriod,
} from './stripe-compat';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => TenantsService))
    private readonly tenantsService: TenantsService,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    @Inject(forwardRef(() => CourtsService))
    private readonly courtsService: CourtsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly pricingService: PricingService,
    @Inject(forwardRef(() => StaffService))
    private readonly staffService: StaffService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly lockService: DistributedLockService,
  ) { }

  /**
   * Nightly reconciliation: every live subscription is re-read from Stripe
   * and pushed through the same sync as the webhooks, then fully-paid
   * tenants get their pending_payment courts released.
   *
   * This is the safety net under everything above. Webhooks can be dropped,
   * an add-on sync can fail and only be logged, an invoice can be paid late
   * from the Stripe dashboard — each of those left a tenant paying for units
   * the app did not know about, or courts stuck in pending_payment, with no
   * process that would ever notice. Now the state converges within a day.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async reconcileWithStripe(): Promise<void> {
    await this.lockService.runExclusively(
      'subscriptions:reconcile',
      30 * 60 * 1000,
      async () => {
        const subscriptions = await this.subscriptionRepository.find({
          where: {
            status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]),
          },
        });
        let synced = 0;
        let failed = 0;
        for (const subscription of subscriptions) {
          if (!subscription.providerSubscriptionId) continue;
          try {
            const live = await this.paymentsService.retrieveSubscription(
              subscription.providerSubscriptionId,
            );
            await this.syncSubscriptionFromStripe(live, subscription.tenantId);
            if (await this.isFullyPaid(subscription.providerSubscriptionId)) {
              await this.activatePendingCourts(subscription.tenantId);
            }
            synced++;
          } catch (error) {
            failed++;
            this.logger.error(
              `[BILLING][RECONCILE] Tenant ${subscription.tenantId} / ${subscription.providerSubscriptionId} failed`,
              error as Error,
            );
          }
        }
        this.logger.log(
          `[BILLING][RECONCILE] ${synced} subscriptions reconciled with Stripe, ${failed} failed`,
        );
      },
    );
  }

  async getCurrentSubscription(tenantId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveSubscription(tenantId: string): Promise<Subscription | null> {
    const subscription = await this.getCurrentSubscription(tenantId);
    if (
      !subscription ||
      ![
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.PAST_DUE,
      ].includes(subscription.status)
    ) {
      return null;
    }
    return subscription;
  }

  async findById(subscriptionId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['tenant'],
    });
  }

  /**
   * Recomputes billable units from actual branch/court counts and syncs
   * the Stripe subscription items via the pricing engine.
   */
  async syncQuantities(tenantId: string): Promise<Subscription> {
    const subscription = await this.getActiveSubscription(tenantId);

    if (!subscription) {
      throw new NotFoundException(ErrorCodes.SUBSCRIPTION_NOT_FOUND);
    }

    await this.pricingService.syncTenantSubscription(subscription);

    return subscription;
  }

  async cancelSubscription(
    tenantId: string,
  ): Promise<Subscription> {
    const subscription = await this.getActiveSubscription(tenantId);

    if (!subscription) {
      throw new NotFoundException(ErrorCodes.SUBSCRIPTION_NOT_FOUND);
    }

    const updated = await this.paymentsService.updateSubscription(
      subscription.providerSubscriptionId,
      {
        cancelAtPeriodEnd: true,
      },
    );

    subscription.metadata = {
      ...subscription.metadata,
      ...this.cancellationMetadata(updated),
    };

    await this.subscriptionRepository.save(subscription);

    this.eventEmitter.emit(SubscriptionEvents.CANCELLED, {
      subscription,
    } as SubscriptionCancelledPayload);

    return subscription;
  }



  async createBillingPortalSession(
    tenantId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const tenant = await this.tenantsService.getTenant(tenantId);

    if (!tenant.providerCustomerId) {
      throw new BadRequestException(ErrorCodes.SUBSCRIPTION_NOT_FOUND);
    }

    const session = await this.paymentsService.createBillingPortalSession(
      tenant.providerCustomerId,
      returnUrl,
    );

    return { url: session.url };
  }

  /**
   * A subscription that already exists AT STRIPE and is still live.
   *
   * Our subscriptions table is only as current as the last webhook, so it can
   * legitimately be empty while Stripe already has one.
   */
  private async findLiveProviderSubscription(tenantId: string) {
    try {
      const candidates =
        await this.paymentsService.searchSubscriptionsByTenant(tenantId);
      return (
        candidates.find((candidate) =>
          ['active', 'trialing', 'past_due', 'unpaid'].includes(
            candidate.status,
          ),
        ) ?? null
      );
    } catch (error) {
      // Never block a genuine first checkout because the lookup failed.
      this.logger.warn(
        `Could not check Stripe for an existing subscription for tenant ${tenantId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async createCheckoutSession(
    tenantId: string,
    branchCount: number,
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<CheckoutSessionResponseDto> {
    const existingSubscription = await this.getActiveSubscription(tenantId);

    // The dashboard's billing page is the only screen that understands the
    // ?subscription= query, so every default lands there. The previous
    // defaults pointed at /dashboard and /pricing — neither route exists in
    // the dashboard app, so a vendor coming back from Stripe saw a blank page.
    const baseUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3001';
    const billingUrl = `${baseUrl}/billing`;

    if (existingSubscription) {
      // Pricing is derived from actual branch/court counts; an active
      // subscription never needs checkout, just a quantity re-sync.
      await this.syncQuantities(tenantId);

      return {
        url: successUrl || `${billingUrl}?subscription=upgraded`,
      };
    }

    // Our own table said "no subscription", but that is only ever as fresh as
    // the last webhook. Ask Stripe before selling a second one: a vendor whose
    // checkout completed while the webhook was delayed (or whose row was
    // rolled back) could press Subscribe again and end up paying twice every
    // month, with two subscriptions to cancel.
    const liveAtProvider = await this.findLiveProviderSubscription(tenantId);
    if (liveAtProvider) {
      this.logger.warn(
        `Tenant ${tenantId} already has subscription ${liveAtProvider.id} (${liveAtProvider.status}) at the provider; adopting it instead of creating another.`,
      );
      await this.syncSubscriptionFromStripe(liveAtProvider, tenantId);
      await this.syncQuantities(tenantId);
      return {
        url: successUrl || `${billingUrl}?subscription=existing`,
      };
    }

    const tenant = await this.tenantsService.getTenant(tenantId);
    const providerCustomerId = await this.ensureProviderCustomer(tenant);

    // Bill what the tenant actually has, from the first invoice. Checkout used
    // to sell the base plan alone (quantity 1) no matter how many branches
    // and courts were already set up, and nothing added the extras afterwards
    // — a vendor with 1 branch and 3 courts paid $30 and the third court was
    // free forever. The same breakdown drives every later sync, so the
    // subscription starts out exactly as it will be maintained.
    const breakdown = await this.pricingService.computeTenantBreakdown(tenantId);
    const lineItems = this.pricingService.buildCheckoutLineItems(breakdown);

    // {CHECKOUT_SESSION_ID} is substituted by Stripe on redirect. The billing
    // page hands it back to POST /subscriptions/sync so the subscription is
    // confirmed from the redirect itself, without depending on webhook timing.
    const withSessionId = (url: string) =>
      `${url}${url.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`;

    const session = await this.paymentsService.createCheckoutSession({
      customerId: providerCustomerId,
      lineItems,
      successUrl: withSessionId(successUrl || `${billingUrl}?subscription=success`),
      cancelUrl: cancelUrl || `${billingUrl}?subscription=cancelled`,
      metadata: { tenantId },
    });

    return {
      url: session.url,
    };
  }

  /**
   * Confirm the tenant's subscription directly from Stripe.
   *
   * Webhooks are the primary path, but they are asynchronous and can be
   * delayed, dropped, or — in local development without `stripe listen` —
   * never delivered. Every one of those left the tenant in a state where
   * Stripe had an ACTIVE subscription and this app had nothing: no local row,
   * no customer id on the tenant, courts stuck in pending_payment, and the
   * billing page still asking them to subscribe.
   *
   * With a Checkout Session id (from the success redirect) the exact
   * subscription is used. Without one, Stripe is searched by the tenantId
   * stamped in metadata at checkout. Both paths run the same sync as the
   * webhooks, so the result is identical whichever arrives first, and safe to
   * repeat.
   */
  async syncFromStripe(
    tenantId: string,
    sessionId?: string,
  ): Promise<{ synced: boolean; status?: SubscriptionStatus }> {
    let stripeSubscription: any = null;

    if (sessionId) {
      const session = await this.paymentsService.retrieveCheckoutSession(sessionId);
      // A session id is a bearer credential for whatever it references, so
      // it must belong to the caller's tenant before we act on it.
      if (session.metadata?.tenantId !== tenantId) {
        this.logger.warn(
          `[BILLING] Checkout session ${sessionId} does not belong to tenant ${tenantId}`,
        );
        throw new ForbiddenException(ErrorCodes.FORBIDDEN);
      }
      const sub = session.subscription;
      stripeSubscription =
        sub && typeof sub === 'object'
          ? sub
          : sub
            ? await this.paymentsService.retrieveSubscription(sub as string)
            : null;
    }

    if (!stripeSubscription) {
      const candidates = await this.paymentsService.searchSubscriptionsByTenant(tenantId);
      const live = ['active', 'trialing', 'past_due'];
      stripeSubscription =
        candidates
          .filter((c) => live.includes(c.status))
          .sort((a, b) => b.created - a.created)[0] ??
        candidates.sort((a, b) => b.created - a.created)[0] ??
        null;
    }

    if (!stripeSubscription) {
      return { synced: false };
    }

    // Defensive: never sync a subscription stamped for a different tenant.
    if (stripeSubscription.metadata?.tenantId !== tenantId) {
      throw new ForbiddenException(ErrorCodes.FORBIDDEN);
    }

    const subscription = await this.syncSubscriptionFromStripe(stripeSubscription);

    // Same rule as invoice.paid: courts go to approval only when nothing is
    // outstanding (past_due means an add-on invoice is still unpaid).
    if (
      subscription.providerSubscriptionId &&
      (await this.isFullyPaid(subscription.providerSubscriptionId))
    ) {
      await this.activatePendingCourts(tenantId);
    }

    return { synced: true, status: subscription.status };
  }

  async getBranchAvailability(
    tenantId: string,
  ): Promise<BranchAvailabilityResponseDto> {
    const subscription = await this.getCurrentSubscription(tenantId);
    const currentCount = await this.branchesService.countByTenant(tenantId);

    // Price impact of one more branch, so the dashboard can warn BEFORE the
    // card is charged. Courts already did this; branches did not, so a vendor
    // adding a second branch first learned the cost from the invoice.
    const breakdown = await this.pricingService.computeTenantBreakdown(tenantId);
    const withNextBranch = this.pricingService.computeBreakdown(
      breakdown.branchCount + 1,
      breakdown.courtCount,
    );
    const chargedNow =
      !!subscription?.providerSubscriptionId &&
      [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE].includes(
        subscription.status,
      );

    return {
      canCreate: this.canAddUnits(subscription),
      currentCount,
      limit: null,
      subscriptionStatus: subscription?.status,
      nextBranchChargeCents:
        withNextBranch.monthlyAmountCents - breakdown.monthlyAmountCents,
      currency: breakdown.currency,
      chargedNow,
    };
  }

  /**
   * Whether the tenant may add a branch or court right now.
   *
   * No subscription at all is allowed: onboarding creates the branch and
   * courts first (they wait in pending_payment) and the first Checkout bills
   * all of them. A subscription that exists but has lapsed (cancelled /
   * unpaid) is not: those units could never be billed. The old rule required
   * an active subscription, which would have blocked every new vendor from
   * creating their first branch, so the check was left commented out and
   * lapsed tenants could add units for free.
   */
  private canAddUnits(subscription: Subscription | null): boolean {
    if (!subscription) {
      return true;
    }
    return [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE].includes(
      subscription.status,
    );
  }

  async checkCanCreateBranch(
    tenantId: string,
  ): Promise<BranchAvailabilityResponseDto> {
    return this.getBranchAvailability(tenantId);
  }

  async getCourtAvailability(
    tenantId: string,
  ): Promise<CourtAvailabilityResponseDto> {
    const subscription = await this.getCurrentSubscription(tenantId);
    const currentCount = await this.courtsService.countByTenant(tenantId);

    // Price impact of one more court, so the dashboard can say "this court
    // adds $10/month, charged now" BEFORE the card is charged. Until now the
    // vendor found out from the invoice.
    const breakdown = await this.pricingService.computeTenantBreakdown(tenantId);
    const withNextCourt = this.pricingService.computeBreakdown(
      breakdown.branchCount,
      breakdown.courtCount + 1,
    );
    const chargedNow =
      !!subscription?.providerSubscriptionId &&
      [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE].includes(
        subscription.status,
      );

    return {
      canCreate: this.canAddUnits(subscription),
      currentCount,
      limit: null,
      subscriptionStatus: subscription?.status,
      nextCourtChargeCents:
        withNextCourt.monthlyAmountCents - breakdown.monthlyAmountCents,
      currency: breakdown.currency,
      chargedNow,
    };
  }

  async getBillingOverview(tenantId: string): Promise<BillingOverviewResponseDto> {
    const subscription = await this.getCurrentSubscription(tenantId);
    const breakdown = await this.pricingService.computeTenantBreakdown(tenantId);

    return {
      subscription: subscription
        ? {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelledAt: subscription.cancelledAt,
          cancelAtPeriodEnd: !!subscription.metadata?.cancelAtPeriodEnd,
          cancelAt: subscription.metadata?.cancelAt
            ? new Date(subscription.metadata.cancelAt as string)
            : null,
        }
        : null,
      breakdown,
      pricing: this.pricingService.getPricing(),
      nextInvoiceAmountCents: subscription
        ? breakdown.monthlyAmountCents
        : null,
    };
  }

  async getBillingInvoices(tenantId: string): Promise<BillingInvoiceDto[]> {
    const tenant = await this.tenantsService.getTenant(tenantId);

    if (!tenant.providerCustomerId) {
      return [];
    }

    const invoices = await this.paymentsService.listInvoices(
      tenant.providerCustomerId,
    );

    return invoices.map((invoice: any) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amountDueCents: invoice.amount_due,
      amountPaidCents: invoice.amount_paid,
      currency: invoice.currency,
      createdAt: new Date(invoice.created * 1000),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
    }));
  }

  async getPendingCharges(tenantId: string): Promise<PendingChargesResponseDto> {
    const pendingCourts =
      await this.courtsService.findPendingPaymentByTenant(tenantId);

    return {
      count: pendingCourts.length,
      courts: pendingCourts.map((court) => ({
        id: court.id,
        name: court.name,
        status: court.status,
        branchId: court.branchId,
      })),
    };
  }

  async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    const stripeSubscription = event.data.object as any;
    await this.syncSubscriptionFromStripe(stripeSubscription);
  }

  async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const stripeSubscription = event.data.object as any;

    const subscription = await this.subscriptionRepository.findOne({
      where: { providerSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription not found for provider ID: ${stripeSubscription.id}`,
      );
      return;
    }

    // One code path for every Stripe -> local sync (status, period,
    // scheduled cancellation, add-on reconciliation). This handler used to
    // keep its own partial copy, which is how the fields drifted apart.
    await this.syncSubscriptionFromStripe(stripeSubscription, subscription.tenantId);
  }

  async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const stripeSubscription = event.data.object as any;

    const subscription = await this.subscriptionRepository.findOne({
      where: { providerSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      return;
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    await this.subscriptionRepository.save(subscription);

    // Until now a cancelled subscription changed nothing: the courts stayed
    // listed and bookable, so a venue could stop paying after month one and
    // keep trading. Flagging the tenant hides its courts and refuses NEW
    // bookings; everything already paid for still goes ahead.
    await this.tenantsService.setSubscriptionLapsed(subscription.tenantId, true);
  }

  async handleInvoicePaid(event: Stripe.Event): Promise<void> {
    const stripeInvoice = event.data.object as any;

    // Basil moved this to invoice.parent.subscription_details.subscription.
    // Reading it directly returned undefined, so this handler bailed out on
    // every invoice and paying tenants were never reactivated.
    const subscriptionId = getInvoiceSubscriptionId(stripeInvoice);
    if (!subscriptionId) {
      this.logger.warn(
        `invoice.paid ${stripeInvoice?.id} carries no subscription id — ignoring.`,
      );
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { providerSubscriptionId: subscriptionId },
    });

    if (!subscription) {
      return;
    }

    if (
      ![
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.PAST_DUE,
      ].includes(subscription.status)
    ) {
      // A paid invoice means the subscription is in good standing again.
      subscription.status = SubscriptionStatus.ACTIVE;
      await this.subscriptionRepository.save(subscription);
    }

    // Trading rights come back the moment the bill is paid.
    await this.tenantsService.setSubscriptionLapsed(subscription.tenantId, false);

    // Payment confirmed: move the tenant's courts that were waiting for
    // payment into the ops approval queue — but only once the account is
    // fully paid up. activatePendingCourts releases EVERY pending court and
    // Stripe fires invoice.paid per invoice, so if court A's proration
    // invoice failed (subscription past_due) and court B's later one
    // succeeded, A went live unpaid. Stripe keeps a subscription `active`
    // only while no invoice is outstanding, so that is the gate. This MUST
    // run before notifications: a notification failure can never block it.
    if (await this.isFullyPaid(subscriptionId)) {
      await this.activatePendingCourts(subscription.tenantId);
    } else {
      this.logger.warn(
        `[BILLING] Invoice ${stripeInvoice.id} paid but subscription ${subscriptionId} still has an outstanding invoice; courts stay pending_payment`,
      );
    }

    try {
      await this.notificationsService.notifyStaff(
        { tenantId: subscription.tenantId },
        {
          email: false,
          type: NotificationType.SUBSCRIPTION_PAYMENT_SUCCEEDED,
          data: {
            kind: NotificationType.SUBSCRIPTION_PAYMENT_SUCCEEDED,
            tenantId: subscription.tenantId,
            invoiceId: stripeInvoice.id,
          },
          resourceId: subscription.id,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send subscription payment succeeded notification for invoice ${stripeInvoice.id}`,
        error,
      );
    }
  }

  /**
   * True when Stripe reports no outstanding invoice on the subscription.
   * Reads Stripe rather than the local row: the local status can lag behind
   * an add-on invoice that was just created and declined.
   */
  private async isFullyPaid(providerSubscriptionId: string): Promise<boolean> {
    try {
      const live = await this.paymentsService.retrieveSubscription(
        providerSubscriptionId,
      );
      return ['active', 'trialing'].includes(live.status);
    } catch (error) {
      // If Stripe cannot be reached, trust the paid invoice we were just told
      // about rather than hold the vendor's courts hostage to an outage.
      this.logger.error(
        `[BILLING] Could not verify status of subscription ${providerSubscriptionId}; assuming paid`,
        error as Error,
      );
      return true;
    }
  }

  /**
   * Flip all of the tenant's pending_payment courts to pending_approval and
   * notify ops about each one. Safe to call multiple times — courts that are
   * no longer pending_payment are simply not matched.
   */
  private async activatePendingCourts(tenantId: string): Promise<void> {
    const courts = await this.courtsService.markTenantCourtsPendingApproval(
      tenantId,
    );

    for (const court of courts) {
      await this.notifyOpsCourtPendingApproval(court);
    }
  }

  async handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    const stripeInvoice = event.data.object as any;

    // Same Basil field move as handleInvoicePaid — this previously returned
    // early on every failed payment, so nobody was ever notified.
    const subscriptionId = getInvoiceSubscriptionId(stripeInvoice);
    if (!subscriptionId) {
      this.logger.warn(
        `invoice.payment_failed ${stripeInvoice?.id} carries no subscription id — ignoring.`,
      );
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { providerSubscriptionId: subscriptionId },
      relations: ['tenant'],
    });

    if (!subscription) {
      return;
    }

    this.eventEmitter.emit(SubscriptionEvents.PAYMENT_FAILED, {
      subscription,
      invoice: stripeInvoice,
    });

    // Stripe reports money in MINOR units on the invoice; the rest of the
    // product works in major units, so convert once here rather than in the
    // template.
    const amountDue = Number(
      stripeInvoice?.amount_due ?? stripeInvoice?.amount_remaining ?? 0,
    );
    const currency = String(stripeInvoice?.currency ?? 'usd').toUpperCase();
    const nextAttemptSeconds = Number(stripeInvoice?.next_payment_attempt ?? 0);

    await this.notificationsService.notifyStaff(
      { tenantId: subscription.tenantId },
      {
        // Was `email: false`, and there was no billing template mapped
        // either, so a vendor whose card expired learned nothing: the
        // subscription lapsed, their courts sat in pending_payment, and the
        // first they heard of it was a customer asking where a court went.
        email: true,
        type: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
        data: {
          kind: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
          tenantId: subscription.tenantId,
          invoiceId: stripeInvoice.id,
        },
        emailData: {
          tenantName: subscription.tenant?.name ?? 'your venue',
          amount: (amountDue / 100).toFixed(2),
          currency,
          invoiceUrl:
            stripeInvoice?.hosted_invoice_url ?? stripeInvoice?.invoice_pdf,
          nextAttempt: nextAttemptSeconds
            ? dayjs.unix(nextAttemptSeconds).format('MMM DD, YYYY')
            : undefined,
        } satisfies SubscriptionPaymentFailedEmailProps,
      },
    );
  }


  async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as any;

    // Base subscription checkout paid: a brand-new subscription is active and
    // every court the tenant created while unsubscribed can now move from
    // pending_payment into the ops approval queue. (The first invoice.paid
    // also covers this; doing it here too guards against webhook ordering.)
    if (session.mode === 'subscription') {
      const tenantId = session.metadata?.tenantId;
      if (tenantId && session.payment_status === 'paid') {
        await this.tenantsService.setProviderCustomerIdIfMissing(
          tenantId,
          session.customer as string,
        );
        await this.activatePendingCourts(tenantId);
      }
      return;
    }

    if (session.mode !== 'setup') {
      return;
    }

    const customerId = session.customer as string;
    const setupIntentId = session.setup_intent as string;

    if (!setupIntentId) {
      return;
    }

    const setupIntent =
      await this.paymentsService.retrieveSetupIntent(setupIntentId);
    const paymentMethodId =
      typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;
  }

  private async notifyOpsCourtPendingApproval(court: Court): Promise<void> {
    await this.notificationsService.notifyOps({
      type: NotificationType.COURT_PENDING_APPROVAL,
      data: {
        kind: NotificationType.COURT_PENDING_APPROVAL,
        courtId: court.id,
        branchId: court.branchId,
        courtName: court.name,
        branchName: court.branch?.name,
        tenantId: court.branch?.tenantId,
      },
      resourceId: court.id,
    });
  }

  private async ensureProviderCustomer(tenant: any): Promise<string> {
    if (tenant.providerCustomerId) {
      return tenant.providerCustomerId;
    }

    // Reuse a customer Stripe already holds for this tenant. Previously the
    // id returned below was never written back to the tenant, so each
    // checkout attempt minted a brand-new Stripe customer — one tenant ended
    // up with several, and the billing portal (which needs ONE customer id)
    // threw SUBSCRIPTION_NOT_FOUND even for a paying tenant.
    const existing = await this.paymentsService.findCustomerByTenant(tenant.id);
    if (existing) {
      await this.tenantsService.setProviderCustomerIdIfMissing(tenant.id, existing.id);
      return existing.id;
    }

    const owner = tenant.ownerId
      ? await this.staffService.getById(tenant.ownerId)
      : null;
    const ownerEmail = owner?.email ?? tenant.owner?.email;
    if (!ownerEmail) {
      throw new BadRequestException(
        'Tenant owner email is required for subscription',
      );
    }

    const customer = await this.paymentsService.createTenantCustomer({
      id: tenant.id,
      name: tenant.name,
      phoneNumber: tenant.phoneNumber,
      email: ownerEmail,
    });

    // Persist immediately, not only from the webhook.
    await this.tenantsService.setProviderCustomerIdIfMissing(tenant.id, customer.id);

    return customer.id;
  }

  private async syncSubscriptionFromStripe(
    stripeSubscription: any,
    tenantIdHint?: string,
  ): Promise<Subscription> {
    const tenantId = await this.resolveTenantId(stripeSubscription, tenantIdHint);

    let subscription = await this.subscriptionRepository.findOne({
      where: { providerSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      // Re-point the tenant's existing row rather than inserting a second one.
      // subscriptions.tenantId is UNIQUE, so a tenant who cancelled and later
      // subscribed again produced a NEW Stripe subscription id, the lookup
      // above missed, the insert below violated the constraint, and the
      // webhook crashed — leaving the returning customer paid but unsubscribed.
      const existingForTenant = await this.subscriptionRepository.findOne({
        where: { tenantId },
      });
      if (existingForTenant) {
        subscription = existingForTenant;
        subscription.providerSubscriptionId = stripeSubscription.id;
        subscription.providerCustomerId = stripeSubscription.customer as string;
        subscription.cancelledAt = null;
      } else {
        subscription = this.subscriptionRepository.create({
          tenantId,
          providerSubscriptionId: stripeSubscription.id,
          providerCustomerId: stripeSubscription.customer as string,
        });
      }
      // The base plan is not necessarily items.data[0] once add-ons exist.
      const basePriceId = this.configService.get('stripe.branchPriceId');
      const items: any[] = stripeSubscription.items?.data ?? [];
      const baseItem = items.find((i) => i.price?.id === basePriceId) ?? items[0];
      subscription.providerPriceId = baseItem?.price?.id ?? subscription.providerPriceId;
    }

    subscription.status = this.mapStripeStatus(stripeSubscription.status);
    subscription.pricePerUnit = PRICING.BASE_AMOUNT_CENTS / 100;
    // Basil moved the billing period onto the subscription ITEMS. Reading the
    // old top-level fields produced `new Date(undefined * 1000)` — an Invalid
    // Date that was then persisted.
    const period = getSubscriptionPeriod(stripeSubscription);
    if (period.start) subscription.currentPeriodStart = period.start;
    if (period.end) subscription.currentPeriodEnd = period.end;
    if (!period.start || !period.end) {
      this.logger.warn(
        `Could not resolve billing period for subscription ${stripeSubscription?.id}; leaving stored period unchanged.`,
      );
    }
    // A cancellation scheduled from the Customer Portal (cancel_at_period_end)
    // arrives here as customer.subscription.updated. Nothing recorded it, so
    // the billing page could not tell the vendor their plan ends on <date>.
    subscription.metadata = {
      ...subscription.metadata,
      ...this.cancellationMetadata(stripeSubscription),
    };

    // Webhook-created subscriptions never set tenant.providerCustomerId,
    // which breaks invoice listing. Backfill it (only when missing).
    await this.tenantsService.setProviderCustomerIdIfMissing(
      tenantId,
      stripeSubscription.customer as string,
    );

    const saved = await this.subscriptionRepository.save(subscription);

    // Reconcile add-ons with what the tenant actually has.
    //
    // Checkout only ever bills the BASE price at quantity 1. A tenant who set
    // up 1 branch and 3 courts before subscribing was charged $30, every
    // pending court was released for approval, and the extra court beyond the
    // 2 included was never added to the Stripe subscription — so it was never
    // billed, this month or any month after. This is the "initial subscription
    // vs court subscription" mismatch: the base plan and the per-unit add-ons
    // were two disconnected things. Syncing here pushes branch/court add-on
    // items (invoiced immediately) whenever the subscription comes into
    // existence or changes, so Stripe always mirrors the real unit counts.
    if (
      [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE].includes(saved.status)
    ) {
      try {
        await this.pricingService.syncTenantSubscription(saved);
      } catch (error) {
        // Never let an add-on sync failure undo the subscription itself; the
        // next unit change or manual sync will retry. Logged for reconciliation.
        this.logger.error(
          `[BILLING][RECONCILE] Add-on sync failed for tenant ${tenantId} / ${saved.providerSubscriptionId}`,
          error as Error,
        );
      }
    }

    return saved;
  }

  /**
   * Our tenant for a Stripe subscription: the tenantId stamped at Checkout,
   * else the local row we already hold for it, else the tenant whose Stripe
   * customer it belongs to (covers subscriptions ops create in Stripe).
   */
  private async resolveTenantId(
    stripeSubscription: any,
    tenantIdHint?: string,
  ): Promise<string> {
    const fromMetadata = stripeSubscription.metadata?.tenantId;
    if (fromMetadata) {
      return fromMetadata;
    }
    if (tenantIdHint) {
      return tenantIdHint;
    }
    const customerId =
      typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id;
    const tenant = await this.tenantsService.findByProviderCustomerId(customerId);
    if (tenant) {
      this.logger.warn(
        `[BILLING] Subscription ${stripeSubscription.id} has no tenantId metadata; resolved tenant ${tenant.id} via customer ${customerId}`,
      );
      return tenant.id;
    }
    throw new BadRequestException(
      `Stripe subscription ${stripeSubscription.id} cannot be matched to a tenant`,
    );
  }

  private cancellationMetadata(stripeSubscription: any) {
    return {
      cancelAtPeriodEnd: !!stripeSubscription?.cancel_at_period_end,
      cancelAt: stripeSubscription?.cancel_at
        ? new Date(stripeSubscription.cancel_at * 1000).toISOString()
        : null,
    };
  }

  /**
   * Map a Stripe subscription status onto ours.
   *
   * Every Stripe status is now listed explicitly. Previously the map covered
   * only four and fell back to `|| SubscriptionStatus.ACTIVE`, so the statuses
   * that mean "this customer has NOT paid" — `incomplete` (the first payment
   * failed), `incomplete_expired` (it never completed) and `paused` — all
   * granted a fully active subscription. That is a free subscription for
   * anyone who starts checkout and abandons the payment.
   *
   * Unknown statuses now fall back to UNPAID, the restrictive direction: a new
   * Stripe status should suspend access pending a look, not hand out access.
   */
  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      // Stripe keeps billing during a trial and a card is already attached.
      trialing: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELLED,
      unpaid: SubscriptionStatus.UNPAID,
      // The subscription's first invoice has not been paid — no access.
      incomplete: SubscriptionStatus.UNPAID,
      incomplete_expired: SubscriptionStatus.CANCELLED,
      paused: SubscriptionStatus.UNPAID,
    };

    const mapped = statusMap[stripeStatus as Stripe.Subscription.Status];
    if (!mapped) {
      this.logger.error(
        `Unrecognised Stripe subscription status "${stripeStatus}" — defaulting to UNPAID. Add it to mapStripeStatus.`,
      );
      return SubscriptionStatus.UNPAID;
    }
    return mapped;
  }

  @OnEvent(BranchEvent.BRANCH_CREATED)
  async handleBranchCreated(event: BranchEventPayload): Promise<void> {
    await this.syncAfterUnitChange(event.branch.tenantId);
  }

  @OnEvent(BranchEvent.BRANCH_DELETED)
  async handleBranchDeleted(event: BranchEventPayload): Promise<void> {
    await this.syncAfterUnitChange(event.branch.tenantId);
  }

  @OnEvent(CourtEvent.COURT_DELETED)
  async handleCourtDeleted(event: CourtEventPayload): Promise<void> {
    const tenantId = event.court.branch?.tenantId;
    if (tenantId) {
      await this.syncAfterUnitChange(tenantId);
    }
  }

  @OnEvent(CourtEvent.COURT_CREATED)
  async handleCourtCreated({
    court,
    branch,
  }: CourtEventPayload & { branch?: any }): Promise<void> {
    const tenantId = branch?.tenantId ?? court.branch?.tenantId;
    if (!tenantId) {
      return;
    }

    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription) {
      // Not subscribed yet: the court waits in pending_payment and is billed
      // as a line item of the first Checkout (see createCheckoutSession).
      return;
    }

    let breakdown: PricingBreakdown;
    try {
      ({ breakdown } =
        await this.pricingService.syncTenantSubscription(subscription));
    } catch (error) {
      // Stripe rejected the add-on (card declined on the proration invoice,
      // API outage, ...). Previously this threw out of the event handler and
      // the court sat in pending_payment with nobody told. Leave it pending —
      // the billing page's pending-charges view and POST /subscriptions/sync
      // reconcile it — but make the failure visible.
      this.logger.error(
        `[BILLING] Add-on sync failed after court ${court.id} was created for tenant ${tenantId}; court stays pending_payment`,
        error as Error,
      );
      return;
    }

    // The court only requires payment if it adds a NEW billable court
    // add-on. A direction of 'increased' alone is not enough: it may come
    // from a branch add-on while the court itself fits within the included
    // units, and such a court must not sit in pending_payment.
    const withoutThisCourt = this.pricingService.computeBreakdown(
      breakdown.branchCount,
      breakdown.courtCount - 1,
    );
    const addsBillableAddon =
      breakdown.courtAddons > withoutThisCourt.courtAddons;

    if (subscription.providerSubscriptionId && addsBillableAddon) {
      // New billable unit: the prorated charge is invoiced immediately and
      // the court stays pending_payment until invoice.paid confirms it.
      await this.notificationsService.notifyStaff(
        { tenantId },
        {
          email: true,
          type: NotificationType.COURT_PENDING_PAYMENT,
          data: {
            kind: NotificationType.COURT_PENDING_PAYMENT,
            courtId: court.id,
            branchId: court.branchId,
            courtName: court.name,
            branchName: branch?.name,
          },
          emailData: {
            courtName: court.name,
            branchName: branch?.name,
          },
          resourceId: court.id,
        },
      );
      return;
    }

    // Court fits within the included units: no charge required, send it
    // straight to the ops approval queue.
    const [updatedCourt] = await this.courtsService.markCourtsPendingApproval([
      court.id,
    ]);
    if (updatedCourt) {
      await this.notifyOpsCourtPendingApproval(updatedCourt);
    }
  }

  private async syncAfterUnitChange(tenantId: string): Promise<void> {
    try {
      const subscription = await this.getActiveSubscription(tenantId);
      if (!subscription) {
        return;
      }
      const { breakdown } =
        await this.pricingService.syncTenantSubscription(subscription);
      await this.reconcilePendingCourts(tenantId, breakdown);
    } catch (error) {
      this.logger.error(
        `Failed to sync subscription quantities for tenant ${tenantId}`,
        error,
      );
    }
  }

  /**
   * After a sync with fresh counts, only courts beyond the included quota
   * (breakdown.courtAddons) genuinely await a charge. Any other
   * pending_payment court never required payment — move it to the same
   * post-payment state (pending_approval + ops notification) that
   * invoice.paid would have produced.
   */
  private async reconcilePendingCourts(
    tenantId: string,
    breakdown: PricingBreakdown,
  ): Promise<void> {
    const pendingCourts =
      await this.courtsService.findPendingPaymentByTenant(tenantId);

    const freeCount = pendingCourts.length - breakdown.courtAddons;
    if (freeCount <= 0) {
      return;
    }

    // Oldest courts fill the included quota first.
    const freeCourtIds = pendingCourts
      .slice(0, freeCount)
      .map((court) => court.id);
    const courts =
      await this.courtsService.markCourtsPendingApproval(freeCourtIds);

    for (const court of courts) {
      await this.notifyOpsCourtPendingApproval(court);
    }
  }
}
