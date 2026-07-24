import { Stripe } from 'stripe';
import { Subscription } from './entities/subscription.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

export enum SubscriptionEvents {
  CREATED = 'subscription.created',
  ACTIVATED = 'subscription.activated',
  QUANTITY_CHANGED = 'subscription.quantity_changed',
  RENEWED = 'subscription.renewed',
  CANCELLED = 'subscription.cancelled',
  REACTIVATED = 'subscription.reactivated',
  PAYMENT_SUCCEEDED = 'subscription.payment_succeeded',
  PAYMENT_FAILED = 'subscription.payment_failed',
}

export interface SubscriptionCreatedPayload {
  subscription: Subscription;
  tenant: Tenant;
}

export interface SubscriptionQuantityChangedPayload {
  subscription: Subscription;
  previousQuantity: number;
  newQuantity: number;
  isUpgrade: boolean;
}

export interface SubscriptionCancelledPayload {
  subscription: Subscription;
}

export interface SubscriptionPaymentFailedPayload {
  subscription: Subscription;
  invoice: Stripe.Invoice;
}

export interface SubscriptionRenewedPayload {
  subscription: Subscription;
  invoice: Stripe.Invoice;
}
