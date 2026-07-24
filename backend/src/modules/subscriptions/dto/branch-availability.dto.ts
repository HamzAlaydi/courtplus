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
    description: 'Maximum number of branches allowed by subscription',
    example: 5,
  })
  limit: number;

  @ApiPropertyOptional({
    description: 'Current subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  subscriptionStatus?: SubscriptionStatus;

}
