/**
 * Currency helpers for the Stripe boundary.
 *
 * Money is stored throughout this codebase in MAJOR units (e.g. 250.00 SAR) as
 * numeric(x,2) — Payment.amount, Booking.totalAmount, TenantBalance.*.
 * Every Stripe API that takes an `amount` expects MINOR units (halalas/cents).
 *
 * Mixing these up silently transfers 1/100th of the intended sum, which is what
 * StripePayoutProvider.createPayout did: it passed the balance's major-unit
 * amount straight into transfers.create, so a 250.00 SAR payout moved 250
 * halalas — 2.50 SAR.
 */

/**
 * Currencies with no minor unit, where Stripe's amount is the major unit.
 * (Anything not listed here is treated as 2-decimal, which covers SAR and USD.)
 */
const ZERO_DECIMAL = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
  'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
]);

/** Convert a stored major-unit amount into the minor units Stripe expects. */
export function toStripeAmount(major: number, currency: string): number {
  const code = (currency || 'sar').toLowerCase();
  if (ZERO_DECIMAL.has(code)) return Math.round(major);
  return Math.round(major * 100);
}

/** Convert a Stripe minor-unit amount back into stored major units. */
export function fromStripeAmount(minor: number, currency: string): number {
  const code = (currency || 'sar').toLowerCase();
  if (ZERO_DECIMAL.has(code)) return minor;
  return Math.round(minor) / 100;
}
