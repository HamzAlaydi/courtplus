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
  PLATFORM_FEE_PERCENTAGE: 0.3,
  DEFAULT_CURRENCY: 'USD',
};
