import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUrl, Min } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Number of branches to subscribe for',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  branchCount: number;

  // These two had @ApiProperty but NO class-validator decorator. Because the
  // global ValidationPipe runs with whitelist: true, a property without a
  // validation decorator is silently STRIPPED from the body — so the URLs the
  // dashboard sent (/billing?subscription=success) never reached the service,
  // which fell back to its default of /dashboard?... — a route that does not
  // exist in the dashboard. That is the blank page after Stripe Checkout.
  //
  // require_tld: false so http://localhost:3001/... is accepted in dev.
  @ApiPropertyOptional({
    description: 'Where Stripe sends the user after a successful checkout',
    example: 'https://dashboard.courtplusapp.com/billing?subscription=success',
  })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Where Stripe sends the user if they abandon checkout',
    example: 'https://dashboard.courtplusapp.com/billing?subscription=cancelled',
  })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  cancelUrl?: string;
}

export class CheckoutSessionResponseDto {
  @ApiProperty({
    description: 'Stripe Checkout Session URL',
    example: 'https://checkout.stripe.com/pay/cs_xxxxx',
  })
  url: string;

}
