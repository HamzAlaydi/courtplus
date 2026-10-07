// NOT @react-email/render: it resolves the Tailwind pipeline through a
// dynamic import that Jest's CJS VM refuses without
// --experimental-vm-modules. Static markup is enough here - every assertion
// is about the CONTENT the recipient reads, not the inlined CSS.
// Required rather than imported because react-dom arrives transitively with
// @react-email and the repo carries no @types/react-dom.
const { renderToStaticMarkup } = require('react-dom/server') as {
  renderToStaticMarkup: (element: unknown) => string;
};

const render = async (element: React.ReactElement) =>
  renderToStaticMarkup(element);
import { BookingConfirmedEmail } from 'src/emails/booking-confirmed';
import { SubscriptionPaymentFailedEmail } from 'src/emails/subscription-payment-failed';
import { PayoutFailedEmail } from 'src/emails/payout-failed';
import { i18next } from './content/i18n';
import type * as React from 'react';

/**
 * Three events used to reach nobody by email: the customer who paid for a
 * booking, the vendor whose subscription payment failed, and the vendor whose
 * withdrawal was refused. Each needed a template, a subject, and an entry in
 * the notification-type map — miss any one and the send is a silent no-op.
 */
describe('transactional emails that previously did not exist', () => {
  describe('booking confirmation (the customer who paid)', () => {
    const props = {
      customerName: 'Sara',
      courtName: 'Court 1',
      branchName: 'Al Shorouk',
      branchAddress: '62, Neighborhood 9, El Shorouk',
      date: 'Sep 27, 2026',
      startTime: '8:00 PM',
      endTime: '9:00 PM',
      sportType: 'football',
      paymentAmount: '500.00',
      currency: 'SAR',
      bookingId: 'bk-1',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=30.1,31.2',
    };

    it('shows what the customer needs at the gate', async () => {
      const html = await render(BookingConfirmedEmail(props));
      expect(html).toContain('Court 1');
      expect(html).toContain('Al Shorouk');
      expect(html).toContain('Sep 27, 2026');
      expect(html).toContain('8:00 PM');
      expect(html).toContain('500.00');
      expect(html).toContain('SAR');
      expect(html).toContain('bk-1');
    });

    it('does NOT claim a split booking is paid', async () => {
      // The organiser of an open match holds an UNCAPTURED authorisation for
      // the whole court and is charged only their own seat. The first version
      // of this email said "booked and paid" and printed the court total — a
      // receipt for up to four times what they owe, on a match that is not
      // secured until every seat is paid.
      const html = await render(
        BookingConfirmedEmail({
          ...props,
          isSplit: true,
          seats: 4,
          paymentAmount: '37.50',
        }),
      );
      expect(html).not.toMatch(/booked and paid/i);
      expect(html).toContain('Your seat is reserved');
      expect(html).toContain('37.50');
      expect(html).toContain('1 of 4 seats');
      expect(html).not.toContain('500.00');
    });

    it('still reads as a receipt for a whole-payment booking', async () => {
      const html = await render(BookingConfirmedEmail(props));
      expect(html).toMatch(/booked and paid/i);
      expect(html).toContain('Your booking is confirmed');
    });

    it('omits directions when the venue has no location on file', async () => {
      const html = await render(
        BookingConfirmedEmail({
          ...props,
          mapsUrl: undefined,
          branchAddress: undefined,
        }),
      );
      expect(html).not.toContain('Get Directions');
      // The rest of the receipt still renders.
      expect(html).toContain('Court 1');
    });
  });

  describe('subscription payment failed (no billing email existed at all)', () => {
    it('states the amount and how to fix it', async () => {
      const html = await render(
        SubscriptionPaymentFailedEmail({
          tenantName: 'Al Shorouk',
          amount: '49.00',
          currency: 'USD',
          invoiceUrl: 'https://invoice.stripe.com/i/test',
          nextAttempt: 'Sep 29, 2026',
        }),
      );
      expect(html).toContain('Al Shorouk');
      expect(html).toContain('49.00');
      expect(html).toContain('Update Payment Method');
      expect(html).toContain('Sep 29, 2026');
    });

    it('drops the button when Stripe gave no hosted invoice', async () => {
      const html = await render(
        SubscriptionPaymentFailedEmail({
          tenantName: 'Al Shorouk',
          amount: '49.00',
          currency: 'USD',
        }),
      );
      expect(html).not.toContain('Update Payment Method');
    });
  });

  describe('payout failed (previously silent in every channel)', () => {
    it('says the money is safe and why it failed', async () => {
      const html = await render(
        PayoutFailedEmail({
          vendorName: 'Al Shorouk',
          amount: '5000.00',
          currency: 'SAR',
          reason: 'Bank account closed',
        }),
      );
      expect(html).toContain('5000.00');
      expect(html).toContain('Bank account closed');
      expect(html).toMatch(/back on your Court\+ balance/i);
    });
  });

  describe('subjects resolve for both languages', () => {
    it.each([
      'booking_confirmed',
      'subscription_payment_failed',
      'payout_failed',
    ])('%s has a real subject in en and ar', (template) => {
      for (const lng of ['en', 'ar']) {
        const subject = i18next.t(`emails.${template}`, { lng });
        // A missing key makes i18next echo the key back, which would ship as
        // the literal subject line "emails.payout_failed".
        expect(subject).not.toContain('emails.');
        expect(subject.length).toBeGreaterThan(5);
      }
    });
  });
});
