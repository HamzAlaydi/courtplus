export enum TransactionType {
  BOOKING_COMPLETED = 'booking_completed',
  BOOKING_REFUNDED = 'booking_refunded',
  PAYOUT_REQUESTED = 'payout_requested',
  PAYOUT_COMPLETED = 'payout_completed',
  PAYOUT_FAILED = 'payout_failed',
  ADJUSTMENT = 'adjustment',
  PLATFORM_FEE = 'platform_fee',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PayoutProvider {
  STRIPE = 'stripe',
  CUSTOM = 'custom'
}

export const PayoutConstants = {
  DEFAULT_MIN_PAYOUT_AMOUNT: 100,
  // PLATFORM_FEE_PERCENTAGE removed. It was hardcoded to 0.3 while the
  // configured and documented rate (COURT_PLUS_PERCENTAGE) was 0.2, so tenants
  // were paid 10 points less than the config claimed and changing the env var
  // had no effect. The rate now comes from config — see BalanceService.
  //
  // Fallback only, for a balance row created before any money has arrived.
  // The real currency is adopted from the first credit (see BalanceService).
  // This was 'USD' while StripeService charges in the court's currency,
  // defaulting to SAR — so every tenant's balance was labelled USD while
  // holding SAR, and payouts were then transferred as USD.
  DEFAULT_CURRENCY: 'SAR',
};
