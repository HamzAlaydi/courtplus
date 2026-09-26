import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '../entities/enums';

export class BranchAvailabilityResponseDto {
  @ApiProperty({
    description: 'Whether the tenant can create a new branch',
    example: true,
  })
  canCreate: boolean;

  @ApiProperty({
    description: 'Current number of branches',
    example: 2,
  })
  currentCount: number;

  @ApiProperty({
    description:
      'What one more branch adds to the monthly bill, in minor units (0 when it fits the included units)',
    example: 2000,
  })
  nextBranchChargeCents: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({
    description:
      'True when the tenant has a live Stripe subscription, so the prorated add-on is charged immediately on creation',
    example: true,
  })
  chargedNow: boolean;

  @ApiPropertyOptional({
    description:
      'Maximum number of branches allowed by subscription (null when billing is per-unit and there is no hard limit)',
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
