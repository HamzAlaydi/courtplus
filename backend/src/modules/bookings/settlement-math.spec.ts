import { roundMoney, splitSeatCount, splitShares } from './booking.constants';

/**
 * The arithmetic behind processPendingPayments: the organiser pays their own
 * seat plus every seat nobody paid for, and the total collected must equal
 * the court price.
 */
describe('split settlement arithmetic', () => {
  const settle = (total: number, seats: number, paidNonCreators: number) => {
    const { share, organiserShare } = splitShares(total, seats);
    const unpaidSeats = Math.max(0, seats - 1 - paidNonCreators);
    const deduction = roundMoney(share * unpaidSeats);
    const organiserPays = roundMoney(organiserShare + deduction);
    const collected = roundMoney(organiserPays + share * paidNonCreators);
    return { share, organiserShare, unpaidSeats, organiserPays, collected };
  };

  it('charges the organiser the whole court when nobody joins an open match', () => {
    // 2-a-side open match, 600 court, zero joiners: the court was blocked all
    // evening, so the venue must still be paid in full. This used to capture
    // nothing at all — the authorisation expired at Stripe.
    const seats = splitSeatCount({ open: true, playersASide: 2, participants: [] });
    const r = settle(600, seats, 0);
    expect(seats).toBe(4);
    expect(r.unpaidSeats).toBe(3);
    expect(r.organiserPays).toBe(600);
    expect(r.collected).toBe(600);
  });

  it('charges the organiser only their share when every seat is paid', () => {
    const r = settle(600, 4, 3);
    expect(r.unpaidSeats).toBe(0);
    expect(r.organiserPays).toBe(150);
    expect(r.collected).toBe(600);
  });

  it('splits the shortfall when some seats are paid and some are not', () => {
    const r = settle(600, 4, 1);
    expect(r.unpaidSeats).toBe(2);
    expect(r.organiserPays).toBe(450);
    expect(r.collected).toBe(600);
  });

  it('always collects exactly the court price, whatever the mix', () => {
    for (const total of [500, 600, 175.5, 999.99]) {
      for (const seats of [2, 3, 4]) {
        for (let paid = 0; paid <= seats - 1; paid++) {
          expect(settle(total, seats, paid).collected).toBe(roundMoney(total));
        }
      }
    }
  });

  it('never asks the organiser for more than the court price', () => {
    for (const seats of [2, 3, 4]) {
      expect(settle(600, seats, 0).organiserPays).toBe(600);
    }
  });
});
