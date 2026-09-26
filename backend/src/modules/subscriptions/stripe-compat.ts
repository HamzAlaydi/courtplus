import Stripe from 'stripe';

/**
 * Compatibility helpers for the Stripe "Basil" API (2025-04-30.basil), which
 * this codebase pins in StripeService and StripePayoutProvider.
 *
 * Basil moved two fields that the subscription code read directly. Because
 * every webhook handler casts `event.data.object as any`, TypeScript could not
 * catch it and both reads silently evaluated to `undefined` in production:
 *
 *   - `invoice.subscription`            -> `invoice.parent.subscription_details.subscription`
 *   - `subscription.current_period_*`   -> `subscription.items.data[].current_period_*`
 *
 * Consequences before this fix:
 *   - handleInvoicePaid() returned early on EVERY invoice, so a tenant who paid
 *     was never reactivated and their courts were never re-enabled.
 *   - handleInvoicePaymentFailed() returned early on every failure, so nobody
 *     was ever notified of a failed payment.
 *   - `new Date(undefined * 1000)` is `Invalid Date`, which was written to
 *     subscription.currentPeriodStart/End.
 *
 * Both the old and new shapes are read so a replay of an older stored event, or
 * a temporary pin to an earlier API version, still works.
 */

/** Resolve the subscription id an invoice belongs to. */
export function getInvoiceSubscriptionId(
  invoice: Stripe.Invoice | Record<string, any>,
): string | undefined {
  const raw = invoice as Record<string, any>;

  // Basil and later.
  const fromParent = raw?.parent?.subscription_details?.subscription;
  if (fromParent) {
    return typeof fromParent === 'string' ? fromParent : fromParent.id;
  }

  // Pre-Basil shape.
  const legacy = raw?.subscription;
  if (legacy) {
    return typeof legacy === 'string' ? legacy : legacy.id;
  }

  // Some invoice shapes only carry it on the line items.
  const fromLine = raw?.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
  if (fromLine) {
    return typeof fromLine === 'string' ? fromLine : fromLine.id;
  }

  return undefined;
}

/**
 * Resolve the current billing period of a subscription.
 *
 * Returns `null` for a boundary rather than an Invalid Date, so callers can
 * decide explicitly instead of persisting NaN.
 */
export function getSubscriptionPeriod(
  subscription: Stripe.Subscription | Record<string, any>,
): { start: Date | null; end: Date | null } {
  const raw = subscription as Record<string, any>;

  const toDate = (seconds: unknown): Date | null =>
    typeof seconds === 'number' && Number.isFinite(seconds)
      ? new Date(seconds * 1000)
      : null;

  // Pre-Basil top-level fields.
  let start = toDate(raw?.current_period_start);
  let end = toDate(raw?.current_period_end);

  // Basil: the period lives on each subscription item. A subscription can have
  // several items (base plan + branch/court add-ons); they share a period, so
  // take the widest span rather than assuming items.data[0].
  if (!start || !end) {
    const items: any[] = raw?.items?.data ?? [];
    for (const item of items) {
      const itemStart = toDate(item?.current_period_start);
      const itemEnd = toDate(item?.current_period_end);
      if (itemStart && (!start || itemStart < start)) start = itemStart;
      if (itemEnd && (!end || itemEnd > end)) end = itemEnd;
    }
  }

  return { start, end };
}
