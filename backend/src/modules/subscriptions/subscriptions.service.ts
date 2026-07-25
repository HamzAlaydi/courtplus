import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
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
import { PricingService, PRICING } from './pricing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

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
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

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

    await this.paymentsService.updateSubscription(
      subscription.providerSubscriptionId,
      {
        cancelAtPeriodEnd: true,
      },
    );

    subscription.metadata = {
      ...subscription.metadata,
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

  async createCheckoutSession(
    tenantId: string,
    branchCount: number,
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<CheckoutSessionResponseDto> {
    const existingSubscription = await this.getActiveSubscription(tenantId);

    if (existingSubscription) {
      // Pricing is derived from actual branch/court counts; an active
      // subscription never needs checkout, just a quantity re-sync.
      await this.syncQuantities(tenantId);

      const baseUrl =
        this.configService.get('app.frontendUrl') || 'http://localhost:3000';
      const defaultSuccessUrl = `${baseUrl}/dashboard?subscription=upgraded`;

      return {
        url: successUrl || defaultSuccessUrl,
      };
    }

    const tenant = await this.tenantsService.getTenant(tenantId);
    const providerCustomerId = await this.ensureProviderCustomer(tenant);
    const priceId = this.configService.get('stripe.branchPriceId');

    const baseUrl =
      this.configService.get('app.frontendUrl') || 'http://localhost:3000';
    const defaultSuccessUrl = `${baseUrl}/dashboard?subscription=success`;
    const defaultCancelUrl = `${baseUrl}/pricing?subscription=cancelled`;

    const session = await this.paymentsService.createCheckoutSession({
      customerId: providerCustomerId,
      priceId,
      quantity: 1,
      successUrl: successUrl || defaultSuccessUrl,
      cancelUrl: cancelUrl || defaultCancelUrl,
      metadata: { tenantId },
    });

    return {
      url: session.url,
    };
  }

  async getBranchAvailability(
    tenantId: string,
  ): Promise<BranchAvailabilityResponseDto> {
    const subscription = await this.getCurrentSubscription(tenantId);
    const currentCount = await this.branchesService.countByTenant(tenantId);

    // Branches are billed per unit: any active subscription can add branches.
    const isActive = !!subscription && [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.PAST_DUE,
    ].includes(subscription.status);

    return {
      canCreate: isActive,
      currentCount,
      limit: null,
      subscriptionStatus: subscription?.status,
    };
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

    const isActive = !!subscription && [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.PAST_DUE,
    ].includes(subscription.status);

    return {
      canCreate: isActive,
      currentCount,
      limit: null,
      subscriptionStatus: subscription?.status,
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
        }
        : null,
      breakdown,
      pricing: {
        baseAmountCents: PRICING.BASE_AMOUNT_CENTS,
        addonAmountCents: PRICING.ADDON_AMOUNT_CENTS,
        currency: PRICING.CURRENCY,
      },
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
    const tenantId = stripeSubscription.metadata?.tenantId;

    if (!tenantId) {
      this.logger.warn(
        `Subscription created without tenantId: ${stripeSubscription.id}`,
      );
      return;
    }

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

    const newStatus = this.mapStripeStatus(stripeSubscription.status);

    subscription.status = newStatus;
    subscription.quantity = this.getBaseItemQuantity(stripeSubscription);
    subscription.currentPeriodStart = new Date(
      stripeSubscription.current_period_start * 1000,
    );
    subscription.currentPeriodEnd = new Date(
      stripeSubscription.current_period_end * 1000,
    );

    await this.subscriptionRepository.save(subscription);


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


  }

  async handleInvoicePaid(event: Stripe.Event): Promise<void> {
    const stripeInvoice = event.data.object as any;

    if (!stripeInvoice.subscription) {
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { providerSubscriptionId: stripeInvoice.subscription as string },
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

    // Payment confirmed: move all of the tenant's courts that were
    // waiting for payment into the ops approval queue.
    await this.activatePendingCourts(subscription.tenantId);
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

    if (!stripeInvoice.subscription) {
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { providerSubscriptionId: stripeInvoice.subscription as string },
      relations: ['tenant'],
    });

    if (!subscription) {
      return;
    }

    this.eventEmitter.emit(SubscriptionEvents.PAYMENT_FAILED, {
      subscription,
      invoice: stripeInvoice,
    });

    await this.notificationsService.notifyStaff(
      { tenantId: subscription.tenantId },
      {
        email: false,
        type: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
        data: {
          kind: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
          tenantId: subscription.tenantId,
          invoiceId: stripeInvoice.id,
        },
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

    const ownerEmail = tenant.owner?.email;
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

    return customer.id;
  }

  private getBaseItemQuantity(stripeSubscription: any): number {
    const basePriceId = this.configService.get('stripe.branchPriceId');
    const items: any[] = stripeSubscription.items?.data ?? [];
    const baseItem =
      items.find((item) => item.price?.id === basePriceId) ?? items[0];
    return baseItem?.quantity ?? 1;
  }

  private async syncSubscriptionFromStripe(
    stripeSubscription: any,
  ): Promise<Subscription> {
    const tenantId = stripeSubscription.metadata.tenantId;

    let subscription = await this.subscriptionRepository.findOne({
      where: { providerSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        tenantId,
        providerSubscriptionId: stripeSubscription.id,
        providerCustomerId: stripeSubscription.customer as string,
        providerPriceId: stripeSubscription.items.data[0].price.id,
      });
    }

    subscription.status = this.mapStripeStatus(stripeSubscription.status);
    subscription.quantity = this.getBaseItemQuantity(stripeSubscription);
    subscription.currentPeriodStart = new Date(
      stripeSubscription.current_period_start * 1000,
    );
    subscription.currentPeriodEnd = new Date(
      stripeSubscription.current_period_end * 1000,
    );

    return this.subscriptionRepository.save(subscription);
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELLED,
      unpaid: SubscriptionStatus.UNPAID,
    };
    return statusMap[stripeStatus] || SubscriptionStatus.ACTIVE;
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
      return;
    }

    const { direction } =
      await this.pricingService.syncTenantSubscription(subscription);

    if (direction === 'increased') {
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
      await this.pricingService.syncTenantSubscription(subscription);
    } catch (error) {
      this.logger.error(
        `Failed to sync subscription quantities for tenant ${tenantId}`,
        error,
      );
    }
  }
}
