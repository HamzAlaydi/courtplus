/**
 * How long a one-time code stays valid.
 *
 * Single source of truth on purpose: the value lived only inside
 * `createVerification`, and the three email templates each hardcoded their own
 * figure — two said 10 minutes and one said 60, none of them matching. A
 * customer who waited 12 minutes was told the code was still good and it was
 * not.
 */
export const VERIFICATION_CODE_TTL_MINUTES = 15;
