import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Stripe } from 'stripe';
import { Payment } from './entities/payment.entity';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RawBodyRequest } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import {
  INVALID_WEBHOOK_SIGNATURE,
  PAYMENT_PROVIDER_ERROR,
  STRIPE_CARD_DECLINED,
} from '../shared/error-codes';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly env: string;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('stripe.secretKey'), {
      apiVersion: '2025-04-30.basil',
    });
    this.env = this.configService.get('env');
  }

  /**
   * Translate Stripe SDK errors into user-presentable API errors so raw
   * provider errors never surface as 500s: card problems become a 400 with a
   * specific code, everything else Stripe-side becomes a 502.
   */
  private translateStripeError(error: unknown): Error {
    const stripeError = error as Stripe.errors.StripeError;
    const type = stripeError?.type ?? '';
    if (type === 'StripeCardError') {
      return new BadRequestException(STRIPE_CARD_DECLINED);
    }
    if (type === 'StripeSignatureVerificationError') {
      return new BadRequestException(INVALID_WEBHOOK_SIGNATURE);
    }
    if (type.startsWith('Stripe')) {
      this.logger.warn(`Stripe API error (${type}): ${stripeError.message}`);
      return new BadGatewayException(PAYMENT_PROVIDER_ERROR);
    }
    return error as Error;
  }

  private async call<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw this.translateStripeError(error);
    }
  }

  async createPaymentIntent({
    currency,
    amount,
    customerId,
    holdAmount = 0,
    paymentMethodId,
  }: Partial<Payment> & {
    holdAmount?: number;
    customerId?: string;
  }) {
    const ephemeralKey = await this.call(() => this.stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2025-02-24.acacia' },
    ));
    const paymentIntent = await this.call(() => this.stripe.paymentIntents.create({
      amount: Math.round(Number(holdAmount + amount) * 100),
      currency: (currency || 'sar').toLowerCase(),
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: this.env === 'dev' ? 'never' : undefined,
      },
      capture_method: holdAmount ? 'manual' : 'automatic',
      setup_future_usage: 'off_session',
      payment_method: paymentMethodId,
      metadata: {
        amount,
        holdAmount,
      },
    }));

    return {
      paymentIntent,
      ephemeralKey: ephemeralKey.secret,
      publishableKey: this.configService.get('stripe.publicKey'),
      clientSecret: paymentIntent.client_secret,
      customerId: customerId,
      paymentMethodId: paymentIntent.payment_method,
    };
  }

  async capturePayment(
    paymentIntentId: string,
    options?: Stripe.PaymentIntentCaptureParams,
  ) {
    await this.call(() => this.stripe.paymentIntents.capture(paymentIntentId, options));
    return true;
  }

  async releasePayment(paymentIntentId: string) {
    await this.call(() => this.stripe.paymentIntents.cancel(paymentIntentId));
    return true;
  }

  async cancelPaymentIntent(paymentIntentId: string) {
    await this.call(() => this.stripe.paymentIntents.cancel(paymentIntentId));
    return true;
  }

  async createCustomer({
    email,
    firstName = '',
    lastName = '',
    phoneNumber,
    id,
  }: User) {
    return this.call(() => this.stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      phone: phoneNumber,
      metadata: {
        id,
        type: 'user',
      },
    }));
  }

  async constructStripeEvent(req: RawBodyRequest<Request>, webhookSecret?: string) {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      throw new BadRequestException(INVALID_WEBHOOK_SIGNATURE);
    }
    const key = webhookSecret ?? this.configService.get('stripe.webhookSecret');
    try {
      return this.stripe.webhooks.constructEvent(req.rawBody, sig, key);
    } catch (error) {
      throw this.translateStripeError(error);
    }
  }

  async refundPayment(paymentIntentId: string) {
    return this.call(() => this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    }));
  }

  async createTenantCustomer(
    tenant: Pick<Tenant, 'id' | 'name' | 'phoneNumber'> & { email: string },
  ): Promise<Stripe.Customer> {
    return this.call(() => this.stripe.customers.create({
      email: tenant.email,
      name: tenant.name,
      phone: tenant.phoneNumber,
      metadata: {
        tenantId: tenant.id,
        type: 'tenant',
      },
    }));
  }

  async createSubscription(params: {
    customerId: string;
    priceId: string;
    quantity: number;
    trialDays?: number;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: params.customerId,
      items: [{ price: params.priceId, quantity: params.quantity }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: params.metadata,
    };

    if (params.trialDays) {
      subscriptionParams.trial_period_days = params.trialDays;
    }

    if (params.paymentMethodId) {
      subscriptionParams.default_payment_method = params.paymentMethodId;
    }

    return this.call(() => this.stripe.subscriptions.create(subscriptionParams));
  }

  async updateSubscription(
    subscriptionId: string,
    params: {
      quantity?: number;
      prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;
      cancelAtPeriodEnd?: boolean;
    },
  ): Promise<Stripe.Subscription> {
    const updateParams: Stripe.SubscriptionUpdateParams = {};

    if (params.quantity !== undefined) {
      const subscription =
        await this.call(() => this.stripe.subscriptions.retrieve(subscriptionId));
      updateParams.items = [
        {
          id: subscription.items.data[0].id,
          quantity: params.quantity,
        },
      ];
      updateParams.proration_behavior =
        params.prorationBehavior || 'create_prorations';
    }

    if (params.cancelAtPeriodEnd !== undefined) {
      updateParams.cancel_at_period_end = params.cancelAtPeriodEnd;
    }

    return this.call(() => this.stripe.subscriptions.update(subscriptionId, updateParams));
  }



  async retrieveSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.call(() => this.stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'default_payment_method'],
    }));
  }

  async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    return this.call(() => this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    }));
  }


  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    quantity: number;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    return this.call(() => this.stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: params.quantity,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data: {
        metadata: params.metadata,
      },
    }));
  }
  async retrieveSetupIntent(
    setupIntentId: string,
  ): Promise<Stripe.SetupIntent> {
    return this.call(() => this.stripe.setupIntents.retrieve(setupIntentId));
  }

  async updateSubscriptionItems(
    subscriptionId: string,
    items: Stripe.SubscriptionUpdateParams.Item[],
    prorationBehavior: Stripe.SubscriptionUpdateParams.ProrationBehavior,
  ): Promise<Stripe.Subscription> {
    return this.call(() => this.stripe.subscriptions.update(subscriptionId, {
      items,
      proration_behavior: prorationBehavior,
    }));
  }

  async listInvoices(
    customerId: string,
    limit = 24,
  ): Promise<Stripe.Invoice[]> {
    const invoices = await this.call(() => this.stripe.invoices.list({
      customer: customerId,
      limit,
    }));
    return invoices.data;
  }
}
