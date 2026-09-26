import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';

/**
 * 'payout.failed' had no listener in NotificationsService and there was no
 * PAYOUT_FAILED notification type at all, so a refused transfer was silent in
 * every channel: the money reappeared on the vendor's balance unexplained and
 * they retried straight into the same failure.
 */
describe('NotificationsService payout.failed', () => {
  const makeService = () => {
    const notifyStaff = jest.fn().mockResolvedValue(undefined);
    const service = Object.create(
      NotificationsService.prototype,
    ) as NotificationsService;
    Object.assign(service, {
      notifyStaff,
      resolveTenantName: jest.fn().mockResolvedValue('Al Shorouk'),
      logger: { warn: jest.fn(), error: jest.fn(), log: jest.fn() },
    });
    return { service: service as any, notifyStaff };
  };

  const payout = {
    id: 'payout-1',
    tenantId: 'tenant-1',
    amount: '5000.00',
    currency: 'SAR',
    failureReason: 'Bank account closed',
  };

  it('notifies the vendor and carries the reason into the email', async () => {
    const { service, notifyStaff } = makeService();

    await service.handlePayoutFailed({ payout });

    expect(notifyStaff).toHaveBeenCalledTimes(1);
    const [target, payload] = notifyStaff.mock.calls[0];
    expect(target).toEqual({ tenantId: 'tenant-1' });
    expect(payload.type).toBe(NotificationType.PAYOUT_FAILED);
    expect(payload.data).toMatchObject({
      payoutId: 'payout-1',
      reason: 'Bank account closed',
    });
    expect(payload.emailData).toMatchObject({
      vendorName: 'Al Shorouk',
      amount: '5000.00',
      currency: 'SAR',
      reason: 'Bank account closed',
    });
  });

  it('still notifies when the provider gave no reason', async () => {
    const { service, notifyStaff } = makeService();

    await service.handlePayoutFailed({
      payout: { ...payout, failureReason: undefined },
    });

    const [, payload] = notifyStaff.mock.calls[0];
    // Undefined rather than an empty string, so the template omits the row
    // instead of printing "Reason:" with nothing after it.
    expect(payload.emailData.reason).toBeUndefined();
    expect(payload.type).toBe(NotificationType.PAYOUT_FAILED);
  });

  it('does nothing for a payout with no tenant', async () => {
    const { service, notifyStaff } = makeService();
    await service.handlePayoutFailed({ payout: { id: 'x' } });
    expect(notifyStaff).not.toHaveBeenCalled();
  });
});
