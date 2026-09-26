import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { SubscriptionStatus } from '../entities/enums';

export class SyncSubscriptionDto {
  @ApiPropertyOptional({
    description:
      'Stripe Checkout Session id from the success redirect (cs_...). When omitted, Stripe is searched by tenant.',
    example: 'cs_test_a1B2c3',
  })
  @IsOptional()
  @IsString()
  @Matches(/^cs_[A-Za-z0-9_]+$/, { message: 'sessionId must be a Stripe Checkout Session id' })
  sessionId?: string;
}

export class SyncSubscriptionResponseDto {
  @ApiProperty({ description: 'Whether a subscription was found on Stripe and synced' })
  synced: boolean;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  status?: SubscriptionStatus;
}
