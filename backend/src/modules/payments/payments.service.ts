import { Inject, Injectable, forwardRef, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { runOnTransactionCommit } from 'typeorm-transactional';
import { StripeService } from './stripe.service';
import {
  Payment,
  PaymentProvider,
  PaymentStatus,
} from './entities/payment.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import type { Request } from 'express';
import { BookingsService } from '../bookings/bookings.service';
import { BookingEventType } from '../bookings/entities/event.entity';
import type { BookingPaymentRefundedEventPayload } from '../bookings/bookings.events';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentJobType } from './payments.processor';
import { PAYMENT } from './payment.constants';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @InjectQueue('payments')
    private readonly queue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async processStripeEvent(req: Request) {
    const stripeEvent = await this.stripeService.constructStripeEvent(req);
    this.logger.log(
      `[PAYMENT_FLOW] Webhook received - eventType: ${stripeEvent.type}, eventId: ${stripeEvent.id}`,
    );
    switch (stripeEvent.type) {
      case 'charge.failed':
      case 'charge.succeeded':
        return this.processPayment(stripeEvent);
      default:
        this.logger.log(
          `[PAYMENT_FLOW] Webhook ignored - unhandled eventType: ${stripeEvent.type}`,
        );
        return;
    }
  }

  private async processPayment(stripeEvent: Stripe.Event) {
    let paymentIntentId: string;
    let paymentIntentStatus: PaymentStatus;
    if (stripeEvent.type === 'charge.succeeded') {
      const charge = stripeEvent.data.object as Stripe.Charge;
      paymentIntentId = charge.payment_intent as string;
      paymentIntentStatus = charge.status == 'succeeded' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    } else if (stripeEvent.type === 'payment_intent.succeeded') {
      const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
      paymentIntentId = paymentIntent.id;
      paymentIntentStatus = paymentIntent.status == 'succeeded' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    } else if (stripeEvent.type === 'payment_intent.payment_failed') {
      const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
      paymentIntentId = paymentIntent.id;
      paymentIntentStatus = PaymentStatus.FAILED;
    }

    this.logger.log(
      `[PAYMENT_FLOW] Processing webhook - stripePaymentIntentId: ${paymentIntentId}, resolvedStatus: ${paymentIntentStatus}, eventId: ${stripeEvent.id}`,
    );

    const payment = await this.paymentsRepository.findOne({
      where: { providerPaymentId: paymentIntentId },
    });
    if (!payment) {
      // Not every charge on the account is a booking payment (e.g.
      // subscription invoices). Acknowledge instead of throwing so Stripe
      // does not retry these for days.
      this.logger.warn(
        `[PAYMENT_FLOW] Webhook ignored - no booking payment for stripePaymentIntentId: ${paymentIntentId}, eventId: ${stripeEvent.id}`,
      );
      return;
    }

    this.logger.log(
      `[PAYMENT_FLOW] Payment found - paymentId: ${payment.id}, currentStatus: ${payment.status}, userId: ${payment.userId}, bookingId: ${payment.bookingId}`,
    );

    // Idempotency guard: skip payments that already reached a processed or
    // terminal state. A payment in `failed` (e.g. from an earlier
    // charge.failed) MUST remain recoverable by a later charge.succeeded,
    // so only fully-processed/terminal statuses are skipped here.
    const SKIPPED_STATUSES: PaymentStatus[] = [
      PaymentStatus.COMPLETED,
      PaymentStatus.HOLD,
      PaymentStatus.RELEASED,
      PaymentStatus.REFUNDED,
      PaymentStatus.CANCELLED,
    ];
    if (SKIPPED_STATUSES.includes(payment.status)) {
      this.logger.warn(
        `[PAYMENT_FLOW] Webhook skipped - already processed: paymentId: ${payment.id}, currentStatus: ${payment.status}, eventId: ${stripeEvent.id}`,
      );
      return;
    }

    if (paymentIntentStatus === PaymentStatus.COMPLETED) {
      this.logger.log(
        `[PAYMENT_FLOW] Processing successful payment - paymentId: ${payment.id}, bookingId: ${payment.bookingId}`,
      );
      await this.bookingsService.processParticipantPayment(payment);
      await this.notificationsService.sendNotification(payment.userId, {
        type: NotificationType.PAYMENT_SUCCEEDED,
        data: {
          bookingId: payment.bookingId,
        },
      });
      this.logger.log(
        `[PAYMENT_FLOW] Payment processed successfully - paymentId: ${payment.id}`,
      );
    } else {
      if (payment.status === PaymentStatus.FAILED) {
        this.logger.warn(
          `[PAYMENT_FLOW] Webhook skipped - already marked as failed: paymentId: ${payment.id}, eventId: ${stripeEvent.id}`,
        );
        return;
      }
      this.logger.warn(
        `[PAYMENT_FLOW] Payment failed via webhook - paymentId: ${payment.id}, userId: ${payment.userId}, bookingId: ${payment.bookingId}`,
      );
      payment.status = PaymentStatus.FAILED;
      await this.paymentsRepository.save(payment);
      await this.notificationsService.sendNotification(payment.userId, {
        type: NotificationType.PAYMENT_FAILED,
        data: {
          bookingId: payment.bookingId,
        },
      });
      this.logger.log(
        `[PAYMENT_FLOW] Payment failure processed - paymentId: ${payment.id}, notification sent to userId: ${payment.userId}`,
      );
    }
  }

  async createPaymentIntentDetails(
    {
      amount,
      holdAmount,
      currency = 'sar',
      data = {},
      bookingId,
    }: Partial<Payment>,
    user: User,
  ) {
    this.logger.log(
      `[PAYMENT_FLOW] Creating payment intent - userId: ${user.id}, amount: ${amount}, holdAmount: ${holdAmount}, bookingId: ${bookingId || 'new'}`,
    );

    if (!user.stripeCustomerId) {
      this.logger.log(`[PAYMENT_FLOW] Creating Stripe customer for user ${user.id}`);
      const customer = await this.stripeService.createCustomer(user);
      await this.usersService.update(user.id, { stripeCustomerId: customer.id });
      user.stripeCustomerId = customer.id;
      this.logger.log(`[PAYMENT_FLOW] Stripe customer created: ${customer.id}`);
    }

    const response = await this.stripeService.createPaymentIntent({
      amount,
      currency,
      customerId: user.stripeCustomerId,
      holdAmount,
    });

    let payment = new Payment();
    payment.amount = amount;
    payment.status = PaymentStatus.PENDING
    payment.userId = user.id;
    payment.holdAmount = holdAmount;
    payment.currency = currency || 'sar';
    payment.provider = PaymentProvider.STRIPE;
    payment.providerPaymentId = response.paymentIntent.id;
    payment.providerCustomerId = user.stripeCustomerId;
    payment.paymentMethodId = response.paymentMethodId as string;
    payment.bookingId = bookingId;
    payment.data = data;
    payment = await this.paymentsRepository.save(payment);

    this.logger.log(
      `[PAYMENT_FLOW] Payment intent created - paymentId: ${payment.id}, stripePaymentIntentId: ${response.paymentIntent.id}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { paymentIntent, ...rest } = response;

    return {
      ...rest,
      paymentId: payment.id,
    };
  }

  async refund(paymentId: string) {
    this.logger.log(
      `[PAYMENT_FLOW] Initiating refund - paymentId: ${paymentId}`,
    );

    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      this.logger.error(`[PAYMENT_FLOW] Refund failed - payment not found: ${paymentId}`);
      throw new Error('Payment not found');
    }

    this.logger.log(
      `[PAYMENT_FLOW] Refund check - paymentId: ${paymentId}, currentStatus: ${payment.status}, userId: ${payment.userId}, bookingId: ${payment.bookingId}`,
    );

    if (payment.status === PaymentStatus.REFUNDED) {
      this.logger.warn(`[PAYMENT_FLOW] Refund skipped - already refunded: ${paymentId}`);
      return null;
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      this.logger.error(
        `[PAYMENT_FLOW] Refund failed - invalid status: ${payment.status}, paymentId: ${paymentId}`,
      );
      throw new Error('Payment is not completed');
    }

    this.logger.log(
      `[PAYMENT_FLOW] Calling Stripe refund - paymentId: ${paymentId}, stripePaymentIntentId: ${payment.providerPaymentId}`,
    );

    let refund: Stripe.Refund;
    try {
      refund = await this.stripeService.refundPayment(
        payment.providerPaymentId,
      );
    } catch (error) {
      this.logger.error(
        `[PAYMENT_FLOW] Stripe refund failed - paymentId: ${paymentId}, userId: ${payment.userId}`,
        error,
      );
      await this.notificationsService.sendNotification(payment.userId, {
        type: NotificationType.REFUND_FAILED,
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
        },
      });
      throw error;
    }

    this.logger.log(
      `[PAYMENT_FLOW] Stripe refund successful - paymentId: ${paymentId}, stripeRefundId: ${refund.id}, refundAmount: ${refund.amount / 100}`,
    );

    await this.paymentsRepository.update(paymentId, {
      status: PaymentStatus.REFUNDED,
      refundId: refund.id,
    });

    this.logger.log(
      `[PAYMENT_FLOW] Payment status updated to REFUNDED - paymentId: ${paymentId}`,
    );

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(BookingEventType.PAYMENT_REFUNDED, {
        bookingId: payment.bookingId,
        userId: payment.userId,
        paymentId: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
      } satisfies BookingPaymentRefundedEventPayload);
    });

    await this.notificationsService.sendNotification(payment.userId, {
      type: NotificationType.REFUND_SUCCEEDED,
      data: {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        refundAmount: refund.amount / 100,
        refundId: refund.id,
        currency: payment.currency,
      },
    });

    this.logger.log(
      `[PAYMENT_FLOW] Refund complete - paymentId: ${paymentId}, userId: ${payment.userId}, amount: ${refund.amount / 100} ${payment.currency}`,
    );

    return refund;
  }

  async release(paymentId: string) {
    this.logger.log(
      `[PAYMENT_FLOW] Initiating payment release - paymentId: ${paymentId}`,
    );

    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      this.logger.error(`[PAYMENT_FLOW] Release failed - payment not found: ${paymentId}`);
      throw new Error('Payment not found');
    }

    this.logger.log(
      `[PAYMENT_FLOW] Release check - paymentId: ${paymentId}, currentStatus: ${payment.status}, userId: ${payment.userId}, bookingId: ${payment.bookingId}`,
    );

    if (payment.status === PaymentStatus.RELEASED) {
      this.logger.warn(`[PAYMENT_FLOW] Release skipped - already released: ${paymentId}`);
      return;
    }

    if (payment.status !== PaymentStatus.HOLD) {
      this.logger.error(
        `[PAYMENT_FLOW] Release failed - invalid status: ${payment.status}, paymentId: ${paymentId}`,
      );
      throw new Error('Payment is not in hold status');
    }

    this.logger.log(
      `[PAYMENT_FLOW] Calling Stripe release - paymentId: ${paymentId}, stripePaymentIntentId: ${payment.providerPaymentId}`,
    );

    await this.stripeService.releasePayment(payment.providerPaymentId);

    this.logger.log(
      `[PAYMENT_FLOW] Stripe release successful - paymentId: ${paymentId}`,
    );

    await this.paymentsRepository.update(paymentId, {
      status: PaymentStatus.RELEASED,
    });

    this.logger.log(
      `[PAYMENT_FLOW] Payment status updated to RELEASED - paymentId: ${paymentId}`,
    );

    await this.notificationsService.sendNotification(payment.userId, {
      type: NotificationType.PAYMENT_RELEASED,
      data: {
        paymentId: payment.id,
        bookingId: payment.bookingId,
      },
    });

    this.logger.log(
      `[PAYMENT_FLOW] Release complete - paymentId: ${paymentId}, userId: ${payment.userId}, bookingId: ${payment.bookingId}`,
    );
  }

  async update(paymentId: string, data: Partial<Payment>) {
    await this.paymentsRepository.update(paymentId, data);
  }

  async save(payment: Payment) {
    return this.paymentsRepository.save(payment);
  }

  findOne(where: FindOptionsWhere<Payment>) {
    return this.paymentsRepository.findOne({ where });
  }

  async completePayment(paymentId: string, amount: number): Promise<void> {
    this.logger.log(
      `[PAYMENT_FLOW] Initiating payment capture - paymentId: ${paymentId}, captureAmount: ${amount}`,
    );

    await this.stripeService.capturePayment(paymentId, {
      amount_to_capture: amount,
      final_capture: true,
    });

    this.logger.log(
      `[PAYMENT_FLOW] Stripe capture successful - paymentId: ${paymentId}, capturedAmount: ${amount}`,
    );

    await this.paymentsRepository.update(paymentId, {
      status: PaymentStatus.COMPLETED,
      amount,
    });

    this.logger.log(
      `[PAYMENT_FLOW] Payment completed - paymentId: ${paymentId}, finalAmount: ${amount}`,
    );
  }

  async cancelPayment(paymentId: string): Promise<void> {
    this.logger.log(
      `[PAYMENT_FLOW] Initiating payment cancellation - paymentId: ${paymentId}`,
    );

    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      this.logger.warn(`[PAYMENT_FLOW] Cancellation skipped - payment not found: ${paymentId}`);
      return;
    }

    this.logger.log(
      `[PAYMENT_FLOW] Cancellation check - paymentId: ${paymentId}, currentStatus: ${payment.status}, userId: ${payment.userId}, bookingId: ${payment.bookingId}`,
    );

    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.log(
        `[PAYMENT_FLOW] Cancellation skipped - not pending: ${paymentId}, status: ${payment.status}`,
      );
      return;
    }

    try {
      this.logger.log(
        `[PAYMENT_FLOW] Calling Stripe cancel - paymentId: ${paymentId}, stripePaymentIntentId: ${payment.providerPaymentId}`,
      );
      await this.stripeService.cancelPaymentIntent(payment.providerPaymentId);
      this.logger.log(
        `[PAYMENT_FLOW] Stripe cancel successful - paymentId: ${paymentId}`,
      );
    } catch (error) {
      this.logger.warn(
        `[PAYMENT_FLOW] Stripe cancel failed - paymentId: ${paymentId}, stripePaymentIntentId: ${payment.providerPaymentId}, error: ${error.message}`,
      );
    }

    await this.paymentsRepository.update(paymentId, {
      status: PaymentStatus.CANCELLED,
    });

    this.logger.log(
      `[PAYMENT_FLOW] Payment cancelled - paymentId: ${paymentId}, userId: ${payment.userId}, bookingId: ${payment.bookingId}`,
    );
  }

  async schedulePaymentCancellation(paymentId: string): Promise<void> {
    const delay = PAYMENT.CANCELLATION_DELAY_SECONDS * 1000;

    this.logger.log(
      `[PAYMENT_FLOW] Scheduling payment cancellation - paymentId: ${paymentId}, delaySeconds: ${PAYMENT.CANCELLATION_DELAY_SECONDS}`,
    );

    await this.queue.add(
      'payment-cancellation',
      {
        paymentId,
        jobType: PaymentJobType.PAYMENT_CANCELLATION,
      },
      {
        jobId: `payment_cancel_${paymentId}`,
        delay,
      },
    );

    this.logger.log(
      `[PAYMENT_FLOW] Payment cancellation scheduled - paymentId: ${paymentId}, jobId: payment_cancel_${paymentId}`,
    );
  }

  async removePaymentCancellation(paymentId: string): Promise<void> {
    this.logger.log(
      `[PAYMENT_FLOW] Removing scheduled payment cancellation - paymentId: ${paymentId}, jobId: payment_cancel_${paymentId}`,
    );
    await this.queue.remove(`payment_cancel_${paymentId}`);
  }

  async updateSubscription(
    subscriptionId: string,
    params: {
      quantity?: number;
      prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
      cancelAtPeriodEnd?: boolean;
    },
  ) {
    return this.stripeService.updateSubscription(subscriptionId, params);
  }

  async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    return this.stripeService.createBillingPortalSession(customerId, returnUrl);
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    quantity: number;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<{ url: string }> {
    return this.stripeService.createCheckoutSession(params);
  }

  async createTenantCustomer(params: {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
  }): Promise<{ id: string }> {
    return this.stripeService.createTenantCustomer(params);
  }

  async retrieveSetupIntent(setupIntentId: string) {
    return this.stripeService.retrieveSetupIntent(setupIntentId);
  }

  async constructWebhookEvent(req: any, webhookSecret?: string) {
    return this.stripeService.constructStripeEvent(req, webhookSecret);
  }

  async updateSubscriptionItems(
    subscriptionId: string,
    items: Stripe.SubscriptionUpdateParams.Item[],
    prorationBehavior: Stripe.SubscriptionUpdateParams.ProrationBehavior,
  ) {
    return this.stripeService.updateSubscriptionItems(
      subscriptionId,
      items,
      prorationBehavior,
    );
  }

  async retrieveSubscription(subscriptionId: string) {
    return this.stripeService.retrieveSubscription(subscriptionId);
  }

  async listInvoices(customerId: string, limit = 24) {
    return this.stripeService.listInvoices(customerId, limit);
  }
}
