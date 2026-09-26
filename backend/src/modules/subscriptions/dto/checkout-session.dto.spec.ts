import { ValidationPipe } from '@nestjs/common';
import { CreateCheckoutSessionDto } from './checkout-session.dto';

/**
 * Regression guard for the blank page after Stripe Checkout.
 *
 * `successUrl` / `cancelUrl` were declared on the DTO with @ApiProperty but
 * no class-validator decorator. The app's global ValidationPipe runs with
 * `whitelist: true`, which STRIPS any property that carries no validation
 * decorator — so the URLs the dashboard sent never reached the service, and
 * it fell back to a default that pointed at a route the dashboard does not
 * have. This test runs the real pipe configuration against the real DTO.
 */
describe('CreateCheckoutSessionDto through the global ValidationPipe', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const metadata = {
    type: 'body' as const,
    metatype: CreateCheckoutSessionDto,
    data: '',
  };

  it('keeps the redirect URLs the client sent', async () => {
    const out = await pipe.transform(
      {
        branchCount: 1,
        successUrl: 'http://localhost:3001/billing?subscription=success',
        cancelUrl: 'http://localhost:3001/billing?subscription=cancelled',
      },
      metadata,
    );
    expect(out.successUrl).toBe('http://localhost:3001/billing?subscription=success');
    expect(out.cancelUrl).toBe('http://localhost:3001/billing?subscription=cancelled');
  });

  it('still allows the URLs to be omitted', async () => {
    const out = await pipe.transform({ branchCount: 1 }, metadata);
    expect(out.successUrl).toBeUndefined();
    expect(out.cancelUrl).toBeUndefined();
  });

  it('rejects a non-URL so a bad redirect fails loudly instead of at Stripe', async () => {
    await expect(
      pipe.transform({ branchCount: 1, successUrl: 'not a url' }, metadata),
    ).rejects.toBeDefined();
  });

  it('still strips properties that genuinely have no validator', async () => {
    const out = await pipe.transform(
      { branchCount: 1, somethingElse: 'x' } as any,
      metadata,
    );
    expect((out as any).somethingElse).toBeUndefined();
  });
});
