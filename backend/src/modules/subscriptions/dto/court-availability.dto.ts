import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '../entities/enums';

export class CourtAvailabilityResponseDto {
  @ApiProperty({
    description: 'Whether the tenant can create a new court',
    example: true,
  })
  canCreate: boolean;

  @ApiProperty({
    description:
      'What one more court adds to the monthly bill, in minor units (0 when it fits the included units)',
    example: 1000,
  })
  nextCourtChargeCents: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({
    description:
      'True when the tenant has a live Stripe subscription, so the prorated add-on is charged immediately on creation',
    example: true,
  })
  chargedNow: boolean;

  @ApiProperty({
    description: 'Current number of courts',
    example: 3,
  })
  currentCount: number;

  @ApiPropertyOptional({
    description:
      'Maximum number of courts allowed by subscription (null when billing is per-unit and there is no hard limit)',
    example: 5,
    nullable: true,
  })
  limit: number | null;

  @ApiPropertyOptional({
    description: 'Current subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  subscriptionStatus?: SubscriptionStatus;
}
