import { StripeService } from './stripe.service';

/**
 * Cancelling a booking loops over its payments. Stripe rejects a repeat
 * cancel with `payment_intent_unexpected_state` and a repeat refund with
 * `charge_already_refunded`; either used to abort the whole cancellation,
 * rolling the database back while the refunds already made at Stripe stood.
 */
describe('StripeService idempotency on cancel and refund', () => {
  const makeService = (stripe: any): StripeService => {
    const service = Object.create(StripeService.prototype) as StripeService;
    Object.assign(service, {
      stripe,
      logger: { warn: jest.fn(), error: jest.fn(), log: jest.fn() },
    });
    return service;
  };

  const unexpectedState = Object.assign(
    new Error('You cannot cancel this PaymentIntent because it has a status of canceled.'),
    { code: 'payment_intent_unexpected_state' },
  );

  it('treats an already-cancelled PaymentIntent as released', async () => {
    const stripe = {
      paymentIntents: {
        cancel: jest.fn().mockRejectedValue(unexpectedState),
        retrieve: jest.fn().mockResolvedValue({ status: 'canceled' }),
      },
    };
    const service = makeService(stripe);

    await expect(service.releasePayment('pi_1')).resolves.toBe(true);
    expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_1');
  });

  it('does not swallow a cancel failure while money is still held', async () => {
    // requires_capture means the authorisation is live: failing to cancel it
    // is a real error and must not be reported as success.
    const stripe = {
      paymentIntents: {
        cancel: jest.fn().mockRejectedValue(unexpectedState),
        retrieve: jest.fn().mockResolvedValue({ status: 'requires_capture' }),
      },
    };
    const service = makeService(stripe);

    await expect(service.releasePayment('pi_2')).rejects.toThrow();
  });

  it('rethrows for a SUCCEEDED intent so the caller leaves the payment pending', async () => {
    // The customer paid right at the reservation deadline. Swallowing this
    // let the caller mark the payment CANCELLED, which made the following
    // charge.succeeded webhook a no-op: charged, no booking, no refund.
    const stripe = {
      paymentIntents: {
        cancel: jest.fn().mockRejectedValue(unexpectedState),
        retrieve: jest.fn().mockResolvedValue({ status: 'succeeded' }),
      },
    };
    const service = makeService(stripe);

    await expect(service.cancelPaymentIntent('pi_paid')).rejects.toThrow();
  });

  it('rethrows for an in-flight (processing) intent', async () => {
    const stripe = {
      paymentIntents: {
        cancel: jest.fn().mockRejectedValue(unexpectedState),
        retrieve: jest.fn().mockResolvedValue({ status: 'processing' }),
      },
    };
    const service = makeService(stripe);

    await expect(service.cancelPaymentIntent('pi_flight')).rejects.toThrow();
  });

  it('propagates the error when the intent cannot be read back', async () => {
    const stripe = {
      paymentIntents: {
        cancel: jest.fn().mockRejectedValue(unexpectedState),
        retrieve: jest.fn().mockRejectedValue(new Error('network')),
      },
    };
    const service = makeService(stripe);

    await expect(service.cancelPaymentIntent('pi_3')).rejects.toThrow();
  });

  it('treats an already-refunded charge as refunded', async () => {
    const stripe = {
      refunds: {
        create: jest.fn().mockRejectedValue(
          Object.assign(new Error('Charge has already been refunded.'), {
            code: 'charge_already_refunded',
          }),
        ),
      },
    };
    const service = makeService(stripe);

    await expect(service.refundPayment('pi_4')).resolves.toBeNull();
  });

  it('still surfaces a genuine refund failure', async () => {
    const stripe = {
      refunds: {
        create: jest.fn().mockRejectedValue(
          Object.assign(new Error('Insufficient funds'), {
            code: 'balance_insufficient',
          }),
        ),
      },
    };
    const service = makeService(stripe);

    await expect(service.refundPayment('pi_5')).rejects.toThrow();
  });
});
