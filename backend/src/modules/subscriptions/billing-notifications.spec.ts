import { SubscriptionsService } from './subscriptions.service';
import { NotificationType } from 'src/modules/notifications/entities/notification.entity';

/**
 * `handleInvoicePaymentFailed` used to call notifyStaff with `email: false`,
 * and there was no billing template mapped either, so a vendor whose card
 * expired was told nothing at all. These cover the part most likely to be
 * wrong now that it does send: Stripe reports invoice money in MINOR units.
 */
describe('SubscriptionsService billing notifications', () => {
  const subscription = {
    id: 'sub-row-1',
    tenantId: 'tenant-1',
    providerSubscriptionId: 'sub_123',
    tenant: { id: 'tenant-1', name: 'Al Shorouk' },
  };

  const makeService = () => {
    const notifyStaff = jest.fn().mockResolvedValue(undefined);
    const service = Object.create(
      SubscriptionsService.prototype,
    ) as SubscriptionsService;
    Object.assign(service, {
      subscriptionRepository: {
        findOne: jest.fn().mockResolvedValue(subscription),
      },
      notificationsService: { notifyStaff },
      eventEmitter: { emit: jest.fn() },
      logger: { warn: jest.fn(), error: jest.fn(), log: jest.fn() },
    });
    return { service, notifyStaff };
  };

  const eventWith = (invoice: Record<string, unknown>) =>
    ({ data: { object: { id: 'in_1', subscription: 'sub_123', ...invoice } } }) as never;

  it('emails the vendor with the amount in MAJOR units', async () => {
    const { service, notifyStaff } = makeService();

    await service.handleInvoicePaymentFailed(
      eventWith({
        amount_due: 4900,
        currency: 'usd',
        hosted_invoice_url: 'https://invoice.stripe.com/i/test',
        next_payment_attempt: 1790000000,
      }),
    );

    expect(notifyStaff).toHaveBeenCalledTimes(1);
    const [target, payload] = notifyStaff.mock.calls[0];
    expect(target).toEqual({ tenantId: 'tenant-1' });
    expect(payload.type).toBe(NotificationType.SUBSCRIPTION_PAYMENT_FAILED);
    // The whole point: this was `false`.
    expect(payload.email).toBe(true);
    expect(payload.emailData).toMatchObject({
      tenantName: 'Al Shorouk',
      amount: '49.00',
      currency: 'USD',
      invoiceUrl: 'https://invoice.stripe.com/i/test',
    });
    expect(payload.emailData.nextAttempt).toBeTruthy();
  });

  it('falls back to the PDF link and omits a retry date when Stripe gives neither', async () => {
    const { service, notifyStaff } = makeService();

    await service.handleInvoicePaymentFailed(
      eventWith({
        amount_remaining: 12550,
        currency: 'sar',
        invoice_pdf: 'https://invoice.stripe.com/pdf',
      }),
    );

    const [, payload] = notifyStaff.mock.calls[0];
    expect(payload.emailData).toMatchObject({
      amount: '125.50',
      currency: 'SAR',
      invoiceUrl: 'https://invoice.stripe.com/pdf',
    });
    expect(payload.emailData.nextAttempt).toBeUndefined();
  });

  it('still ignores an invoice that carries no subscription', async () => {
    const { service, notifyStaff } = makeService();
    await service.handleInvoicePaymentFailed({
      data: { object: { id: 'in_2' } },
    } as never);
    expect(notifyStaff).not.toHaveBeenCalled();
  });
});
