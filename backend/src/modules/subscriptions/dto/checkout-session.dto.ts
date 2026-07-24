import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Number of branches to subscribe for',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  branchCount: number;

  @ApiProperty({
    description: 'Success URL',
    example: 'https://example.com/success',
  })
  successUrl: string;

  @ApiProperty({
    description: 'Cancel URL',
    example: 'https://example.com/cancel',
  })
  cancelUrl: string;
}

export class CheckoutSessionResponseDto {
  @ApiProperty({
    description: 'Stripe Checkout Session URL',
    example: 'https://checkout.stripe.com/pay/cs_xxxxx',
  })
  url: string;

}
