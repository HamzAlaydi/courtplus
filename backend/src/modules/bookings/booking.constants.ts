export const BOOKING = {
  MINUTES_PER_HOUR: 60,
  MIN_DURATION_MINUTES: 30,

  /**
   * Sized for the largest match the product supports: 11-a-side football.
   *
   * This was 4, which is right for padel and tennis and impossible for
   * anything else — a five-a-side organiser could not create the match at
   * all, and the open-match join check refused the fifth player no matter
   * what the organiser had chosen. Racket sports are still constrained by
   * what the client offers (1v1, 2v2); this is only the ceiling.
   */
  MAX_PARTICIPANTS_PER_BOOKING: 22,
  MIN_PLAYERS_PER_SIDE: 1,
  MAX_PLAYERS_PER_SIDE: 11,
  SRID_WGS84: 4326,
  SLOT_RESERVATION_TTL_SECONDS: 600,
  /**
   * Customers may cancel (with a full refund) only up to this many hours
   * before the start. Inside the window the seat is theirs to keep; the
   * venue's own staff can still cancel at any time (customers are refunded).
   */
  CANCELLATION_CUTOFF_HOURS: 12,
} as const;

/** Round a money amount to the 2 decimals every money column stores. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * How many people will ultimately share the price of a split booking.
 *
 * An open match is shared by every seat on the court, not just the friends
 * invited up front — usually none. Using `participants.length + 1` meant an
 * open match with no invitees made the organiser's share the WHOLE court and
 * the hold zero, so Stripe captured the full price immediately and every
 * joiner then paid again on top.
 */
export function splitSeatCount(input: {
  open?: boolean;
  playersASide?: number;
  participants?: unknown[];
}): number {
  if (input.open) {
    return Math.max(2, (input.playersASide ?? BOOKING.MIN_PLAYERS_PER_SIDE) * 2);
  }
  return (input.participants?.length ?? 0) + 1;
}

/**
 * Split a total across `seats` so the parts always add back up to the total:
 * every joiner pays the same rounded share and the organiser absorbs the
 * remainder.
 */
export function splitShares(
  total: number,
  seats: number,
): { share: number; organiserShare: number } {
  if (seats <= 1) return { share: total, organiserShare: total };
  const share = roundMoney(total / seats);
  return { share, organiserShare: roundMoney(total - share * (seats - 1)) };
}

export const REMINDER_INTERVALS = {
  HOUR: 60,
  HALF_HOUR: 30,
  QUARTER_HOUR: 15,
} as const;
