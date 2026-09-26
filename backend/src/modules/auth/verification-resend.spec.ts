import { VerificationService } from './verification.service';
import { VerificationContext, VerificationChannel } from './entities/verification.entity';

/**
 * The one action offered to someone who has not received their code is
 * "Resend". It used to overwrite the stored hash BEFORE the new mail was
 * sent, so a resend that failed to send left the account with no usable code
 * at all — the code they already had was gone too.
 */
describe('VerificationService resend ordering', () => {
  const makeService = (sendEmail: jest.Mock) => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const service = Object.create(VerificationService.prototype) as VerificationService;
    Object.assign(service, {
      verificationsRepository: { upsert },
      emailService: { sendEmail },
      otpGenerator: () => '123456',
      logger: { warn: jest.fn(), error: jest.fn(), log: jest.fn() },
    });
    return { service, upsert };
  };

  // A plain object, not a real Staffer: importing the entity drags in the
  // whole TypeORM graph, and sendVerificationEmail no longer branches on
  // `instanceof`.
  const staffer = {
    id: 'staff-1',
    email: 'owner@example.com',
    firstName: 'Ann',
    lastName: 'Lee',
  } as never;

  it('stores the new code only after the email has gone out', async () => {
    const order: string[] = [];
    const sendEmail = jest.fn().mockImplementation(async () => {
      order.push('send');
    });
    const { service, upsert } = makeService(sendEmail);
    upsert.mockImplementation(async () => {
      order.push('persist');
    });

    await service.sendVerificationEmail(
      staffer,
      VerificationContext.ACCOUNT_VERIFICATION,
    );

    expect(order).toEqual(['send', 'persist']);
  });

  it('leaves the previous code intact when the send fails', async () => {
    const sendEmail = jest.fn().mockRejectedValue(new Error('SMTP down'));
    const { service, upsert } = makeService(sendEmail);

    await expect(
      service.sendVerificationEmail(
        staffer,
        VerificationContext.ACCOUNT_VERIFICATION,
      ),
    ).rejects.toThrow('SMTP down');

    // Nothing was written, so whatever code the user already holds still works.
    expect(upsert).not.toHaveBeenCalled();
  });

  it('emails the code together with the real expiry window', async () => {
    const sendEmail = jest.fn().mockResolvedValue(undefined);
    const { service } = makeService(sendEmail);

    await service.sendVerificationEmail(
      staffer,
      VerificationContext.ACCOUNT_VERIFICATION,
    );

    const [{ data, to }] = sendEmail.mock.calls[0];
    expect(to).toEqual(['owner@example.com']);
    expect(data.otp).toBe('123456');
    // Templates used to hardcode 10 (and one said 60) against a 15-minute TTL.
    expect(data.expiresInMinutes).toBe(15);
  });

  it('still writes the code on the non-email path', async () => {
    const { service, upsert } = makeService(jest.fn());
    const code = await service.createVerification({
      userId: 'staff-1',
      context: VerificationContext.ACCOUNT_VERIFICATION,
      identifier: 'owner@example.com',
      channel: VerificationChannel.EMAIL,
      userType: 'staff' as never,
    });
    expect(code).toBe('123456');
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
