import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment intent ID' })
  paymentId: string;

  @ApiProperty({ description: 'Ephemeral key for Stripe client' })
  ephemeralKey: string;

  @ApiProperty({ description: 'Client secret for Stripe payment intent' })
  clientSecret: string;

  @ApiProperty({ description: 'Stripe publishable key' })
  publishableKey: string;

  @ApiProperty({ description: 'Stripe customer ID' })
  customerId: string;
}
