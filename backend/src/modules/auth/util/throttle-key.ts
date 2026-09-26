/**
 * Normalisers for rate-limit keys.
 *
 * Throttle keys were built straight from the raw request body
 * (`login-email-${request.body.email}`). Account lookup lowercases the
 * address, so `admin@x.com`, `Admin@x.com` and `ADMIN@X.COM` all resolve to
 * the SAME account but produced three different rate-limit buckets — an
 * attacker simply varied the capitalisation to get unlimited password and OTP
 * attempts against one account. Phone numbers had the same problem via
 * spacing and `+`/`00` prefix variants.
 *
 * The key must be derived from the same normalised value the lookup uses.
 */

/** Lowercase + trim, matching how the account lookup resolves an email. */
export function normalizeEmailKey(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : 'unknown';
}

/**
 * Reduce a phone number to its digits so that `+966 50 123 4567`,
 * `+966501234567` and `00966501234567` share one bucket.
 */
export function normalizePhoneKey(phone: unknown): string {
  if (typeof phone !== 'string') return 'unknown';
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  return digits || 'unknown';
}

/**
 * Rate-limit key for a credential attempt: WHO is being targeted plus WHERE
 * the attempt came from.
 *
 * Keying on the identity alone meant six requests from anyone — a stranger who
 * merely knew a vendor's address — blocked that account's login for an hour.
 * That is a denial of service against any known e-mail. Including the origin
 * keeps brute-force protection per attacker while leaving the real owner their
 * own budget.
 *
 * A distributed attack still gets one budget per source; a global per-identity
 * cap would need a second, much looser throttler and is noted in the issue
 * register rather than guessed at here.
 */
export function authAttemptKey(
  scope: string,
  identity: string,
  ip: string | undefined,
): string {
  return `${scope}-${identity}-${ip ?? 'unknown-ip'}`;
}
