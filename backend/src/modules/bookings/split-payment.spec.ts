import { roundMoney, splitSeatCount, splitShares } from './booking.constants';

/**
 * Guards the split-payment maths that let an open match charge its organiser
 * the whole court and then charge every joiner again on top.
 */
describe('split payment maths', () => {
  describe('splitSeatCount', () => {
    it('counts every seat on the court for an open match, not the invitees', () => {
      // The bug: an open 2-a-side match with nobody invited yet counted ONE
      // seat, so the organiser's "share" was 100% of the price.
      expect(splitSeatCount({ open: true, playersASide: 2, participants: [] })).toBe(4);
      expect(splitSeatCount({ open: true, playersASide: 1, participants: [] })).toBe(2);
    });

    it('ignores how many have joined so far', () => {
      expect(
        splitSeatCount({ open: true, playersASide: 2, participants: ['a', 'b'] }),
      ).toBe(4);
    });

    it('never drops below two seats for an open match', () => {
      expect(splitSeatCount({ open: true, participants: [] })).toBe(2);
    });

    it('counts the organiser plus invitees for a private split', () => {
      expect(splitSeatCount({ participants: ['a', 'b'] })).toBe(3);
      expect(splitSeatCount({ participants: [] })).toBe(1);
    });
  });

  describe('splitShares', () => {
    it('splits evenly when the total divides cleanly', () => {
      const { share, organiserShare } = splitShares(400, 4);
      expect(share).toBe(100);
      expect(organiserShare).toBe(100);
    });

    it('always adds back up to the total, remainder on the organiser', () => {
      const total = 100;
      const seats = 3;
      const { share, organiserShare } = splitShares(total, seats);
      expect(share).toBe(33.33);
      expect(organiserShare).toBe(33.34);
      expect(roundMoney(share * (seats - 1) + organiserShare)).toBe(total);
    });

    it('keeps the parts summing to the total for awkward amounts', () => {
      for (const total of [150, 175.5, 999.99, 233.33]) {
        for (const seats of [2, 3, 4]) {
          const { share, organiserShare } = splitShares(total, seats);
          expect(roundMoney(share * (seats - 1) + organiserShare)).toBe(
            roundMoney(total),
          );
        }
      }
    });

    it('charges a single seat the whole price', () => {
      expect(splitShares(250, 1)).toEqual({ share: 250, organiserShare: 250 });
    });

    it('leaves a real hold for the organiser on an open match', () => {
      // holdAmount 0 made Stripe capture automatically while the rest of the
      // code still treated the payment as an uncaptured authorisation.
      const total = 600;
      const seats = splitSeatCount({ open: true, playersASide: 2, participants: [] });
      const { organiserShare } = splitShares(total, seats);
      const holdAmount = roundMoney(total - organiserShare);
      expect(holdAmount).toBeGreaterThan(0);
      expect(organiserShare).toBeLessThan(total);
    });
  });

  describe('roundMoney', () => {
    it('rounds to the two decimals the money columns store', () => {
      expect(roundMoney(33.333333)).toBe(33.33);
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
      expect(roundMoney(1.005)).toBe(1.01);
    });
  });
});
