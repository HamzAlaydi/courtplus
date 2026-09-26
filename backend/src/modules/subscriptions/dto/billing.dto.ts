import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '../entities/enums';
import { CourtStatus } from '../../courts/entities/court.entity';

export class BillingSubscriptionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @ApiPropertyOptional({ nullable: true })
  currentPeriodStart?: Date;

  @ApiPropertyOptional({ nullable: true })
  currentPeriodEnd?: Date;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt?: Date;

  @ApiPropertyOptional({
    description: 'True when the plan is scheduled to end at the period end',
    example: false,
  })
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({ nullable: true, description: 'When the plan ends' })
  cancelAt?: Date | null;
}

export class PricingBreakdownDto {
  @ApiProperty({ example: 2 })
  branchCount: number;

  @ApiProperty({ example: 4 })
  courtCount: number;

  @ApiProperty({
    description: 'Number of courts included in the base plan and extra branches',
    example: 3,
  })
  includedCourts: number;

  @ApiProperty({
    description: 'Extra branches beyond the one included in the base plan',
    example: 1,
  })
  branchAddons: number;

  @ApiProperty({
    description: 'Extra courts beyond the included units',
    example: 1,
  })
  courtAddons: number;

  @ApiProperty({ example: 2 })
  billableAddons: number;

  @ApiProperty({ example: 5000 })
  monthlyAmountCents: number;

  @ApiProperty({ example: 'usd' })
  currency: string;
}

export class BillingOverviewResponseDto {
  @ApiPropertyOptional({ type: BillingSubscriptionDto, nullable: true })
  subscription: BillingSubscriptionDto | null;

  @ApiProperty({ type: PricingBreakdownDto })
  breakdown: PricingBreakdownDto;

  @ApiProperty({
    example: {
      baseAmountCents: 3000,
      addonAmountCents: 1000,
      currency: 'usd',
    },
  })
  pricing: {
    baseAmountCents: number;
    addonAmountCents: number;
    currency: string;
  };

  @ApiPropertyOptional({
    description: 'Expected amount of the next invoice in cents',
    example: 5000,
    nullable: true,
  })
  nextInvoiceAmountCents: number | null;
}

export class BillingInvoiceDto {
  @ApiProperty({ example: 'in_1Tw…' })
  id: string;

  @ApiPropertyOptional({ nullable: true })
  number?: string;

  @ApiProperty({ example: 'paid' })
  status: string;

  @ApiProperty({ example: 5000 })
  amountDueCents: number;

  @ApiProperty({ example: 5000 })
  amountPaidCents: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  hostedInvoiceUrl?: string;

  @ApiPropertyOptional({ nullable: true })
  pdfUrl?: string;
}

export class PendingChargeCourtDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Center Court' })
  name: string;

  @ApiProperty({ enum: CourtStatus, example: CourtStatus.PENDING_PAYMENT })
  status: CourtStatus;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  branchId: string;
}

export class PendingChargesResponseDto {
  @ApiProperty({
    description: 'Number of courts waiting for payment',
    example: 2,
  })
  count: number;

  @ApiProperty({ type: [PendingChargeCourtDto] })
  courts: PendingChargeCourtDto[];
}
