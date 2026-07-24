import {
  BadRequestException,
  ConflictException,
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
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Stripe } from 'stripe';

import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus } from './entities/enums';
import {

  BranchAvailabilityResponseDto,
  CheckoutSessionResponseDto,
} from './dto';
import { PaymentsService } from '../payments/payments.service';
import { TenantsService } from '../tenants/tenants.service';
import { BranchesService } from '../branches/branches.service';
import {
  SubscriptionEvents,

  SubscriptionQuantityChangedPayload,
  SubscriptionCancelledPayload,
} from './subscriptions.events';
import * as ErrorCodes from '../shared/error-codes';
import { BranchEvent, BranchEventPayload } from '../branches/branch.events';


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

  async updateQuantity(
    tenantId: string,
    {
      newBranchCount,
      prorationBehavior,
    }: { newBranchCount: number; prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior },
  ): Promise<Subscription> {
    const subscription = await this.getActiveSubscription(tenantId);

    if (!subscription) {
      throw new NotFoundException(ErrorCodes.SUBSCRIPTION_NOT_FOUND);
    }

    const previousQuantity = subscription.quantity;

    if (newBranchCount < subscription.quantity) {
      const currentBranchCount =
        await this.branchesService.countByTenant(tenantId);
      if (newBranchCount < currentBranchCount) {
        throw new BadRequestException(
          `Cannot reduce to ${newBranchCount} branches. You have ${currentBranchCount} active branches.`,
        );
      }
    }

    const stripeSubscription = await this.paymentsService.updateSubscription(
      subscription.providerSubscriptionId,
      {
        quantity: newBranchCount,
        prorationBehavior: prorationBehavior || 'create_prorations',
      },
    );

    subscription.quantity = newBranchCount;
    subscription.currentPeriodEnd = new Date(
      (stripeSubscription as any).current_period_end * 1000,
    );
    await this.subscriptionRepository.save(subscription);


    this.eventEmitter.emit(SubscriptionEvents.QUANTITY_CHANGED, {
      subscription,
      previousQuantity,
      newQuantity: newBranchCount,
      isUpgrade: newBranchCount > previousQuantity,
    } as SubscriptionQuantityChangedPayload);

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
      if (branchCount <= existingSubscription.quantity) {
        throw new BadRequestException(
          'Cannot downgrade subscription through checkout. Use billing portal or contact support.',
        );
      }

      await this.updateQuantity(tenantId, {
        newBranchCount: branchCount,
        prorationBehavior: 'create_prorations',
      });

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
      quantity: branchCount,
      successUrl: successUrl || defaultSuccessUrl,
      cancelUrl: cancelUrl || defaultCancelUrl,
      metadata: { tenantId },
    });

    return {
      url: session.url,
    };
  }

  async incrementBranchCount(tenantId: string): Promise<Subscription> {
    let subscription = await this.getActiveSubscription(tenantId);



    const newQuantity = subscription.quantity + 1;

    const stripeSubscription = await this.paymentsService.updateSubscription(
      subscription.providerSubscriptionId,
      {
        quantity: newQuantity,
        prorationBehavior: 'create_prorations',
      },
    );

    const previousQuantity = subscription.quantity;
    subscription.quantity = newQuantity;
    subscription.currentPeriodEnd = new Date(
      (stripeSubscription as any).current_period_end * 1000,
    );
    await this.subscriptionRepository.save(subscription);


    this.eventEmitter.emit(SubscriptionEvents.QUANTITY_CHANGED, {
      subscription,
      previousQuantity,
      newQuantity,
      isUpgrade: true,
    } as SubscriptionQuantityChangedPayload);

    return subscription;
  }

  async decrementBranchCount(tenantId: string): Promise<Subscription | null> {
    const subscription = await this.getActiveSubscription(tenantId);

    if (!subscription || subscription.quantity <= 1) {
      return subscription;
    }

    const newQuantity = subscription.quantity - 1;

    const stripeSubscription = await this.paymentsService.updateSubscription(
      subscription.providerSubscriptionId,
      {
        quantity: newQuantity,
        prorationBehavior: 'none',
      },
    );

    const previousQuantity = subscription.quantity;
    subscription.quantity = newQuantity;
    subscription.currentPeriodEnd = new Date(
      (stripeSubscription as any).current_period_end * 1000,
    );
    await this.subscriptionRepository.save(subscription);


    this.eventEmitter.emit(SubscriptionEvents.QUANTITY_CHANGED, {
      subscription,
      previousQuantity,
      newQuantity,
      isUpgrade: false,
    } as SubscriptionQuantityChangedPayload);

    return subscription;
  }



  async getBranchAvailability(
    tenantId: string,
  ): Promise<BranchAvailabilityResponseDto> {
    const subscription = await this.getCurrentSubscription(tenantId);
    const currentCount = await this.branchesService.countByTenant(tenantId);

    if (!subscription) {
      return {
        canCreate: false,
        currentCount,
        limit: 0,
      };
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return {
        canCreate: false,
        currentCount,
        limit: subscription.quantity,
        subscriptionStatus: subscription.status,
      };
    }

    const canCreate = currentCount < subscription.quantity;

    return {
      canCreate,
      currentCount,
      limit: subscription.quantity,
      subscriptionStatus: subscription.status,
    };
  }

  async checkCanCreateBranch(
    tenantId: string,
  ): Promise<BranchAvailabilityResponseDto> {
    return this.getBranchAvailability(tenantId);
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
    subscription.quantity = stripeSubscription.items.data[0].quantity;
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
  }


  async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as any;

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
    subscription.quantity = stripeSubscription.items.data[0].quantity;
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

  @OnEvent(BranchEvent.BRANCH_DELETED)
  async handleBranchDeleted(event: BranchEventPayload): Promise<void> {
    const { branch } = event;
    const subscription = await this.getActiveSubscription(branch.tenantId);
    if (!subscription) {
      return;
    }
    await this.decrementBranchCount(branch.tenantId);
  }
}
