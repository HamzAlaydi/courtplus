import { BaseEntity } from 'src/common/base-entity';
import { Branch } from 'src/modules/branches/entities/branch.entity';
import { Staffer } from 'src/modules/staff/entities/staff.entity';
import { StaffInvitation } from 'src/modules/staff/entities/staff-invitation.entity';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { Asset } from 'src/modules/assets/entities/asset.entity';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Subscription } from 'src/modules/subscriptions/entities/subscription.entity';
import { PaymentProvider } from 'src/modules/payments/entities/payment.entity';
import { TenantPreferences } from './tenant-preferences.entity';

export type TenantCount = keyof Pick<
  Tenant,
  | 'totalBranches'
  | 'totalCourts'
  | 'totalStaff'
  | 'totalRevenue'
  | 'totalBookings'
  | 'totalReviews'
>;

export class ProfileCompletion {
  @ApiProperty({
    description: 'Whether tenant name is completed',
    example: true,
  })
  name: boolean;

  @ApiProperty({
    description: 'Whether tenant logo is uploaded',
    example: false,
  })
  logo: boolean;

  @ApiProperty({
    description: 'Whether tenant phone number is set',
    example: true,
  })
  phoneNumber: boolean;

  @ApiProperty({
    description: 'Whether tenant has branches configured',
    example: false,
  })
  branches: boolean;

  @ApiProperty({
    description: 'Whether tenant has courts configured',
    example: false,
  })
  courts: boolean;
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  @ApiProperty({
    description: 'The name of the tenant',
    example: 'Sports Complex A',
    nullable: true,
  })
  @Column({ nullable: true })
  name?: string;

  @ApiProperty({
    description: 'The phone number of the tenant',
    example: '+1234567890',
    nullable: true,
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    description: 'The total number of courts in the tenant',
    example: 10,
    nullable: true,
  })
  @Column({ nullable: true })
  totalCourts?: number;

  @ApiProperty({
    description: 'The total number of branches in the tenant',
    example: 10,
    nullable: true,
  })
  @Column({ nullable: true })
  totalBranches?: number;

  @ApiProperty({
    description: 'The total number of staff members in the tenant',
    example: 10,
    nullable: true,
  })
  @Column({ nullable: true })
  totalStaff?: number;

  @ApiProperty({
    description: 'The total number of bookings in the tenant',
    example: 10,
    nullable: true,
  })
  @Column({ nullable: true })
  totalBookings?: number;

  @ApiProperty({
    description: 'The total number of reviews in the tenant',
    example: 10,
    nullable: true,
  })
  @Column({ nullable: true })
  totalReviews?: number;

  @ApiProperty({
    description: 'The total revenue of the tenant',
    example: 1000,
    nullable: true,
  })
  @Column({ nullable: true })
  totalRevenue?: number;

  @ApiProperty({
    description: 'Profile completion status',
    type: ProfileCompletion,
  })
  @Column({
    type: 'jsonb',
  })
  profileCompletion: ProfileCompletion;

  @ApiProperty({
    description: 'ID of the tenant owner',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @Column({ nullable: true })
  ownerId?: string;

  @ApiProperty({
    description: 'The ID of the tenant logo asset',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @Column({ nullable: true })
  logoAssetId?: string;

  @ApiProperty({
    description: 'The avatar asset of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @ManyToOne(() => Asset, {
    nullable: true,

    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'logoAssetId', referencedColumnName: 'id' })
  logo?: Asset;

  @ApiProperty({
    description: 'The owner staff member',
    type: () => Staffer,
    nullable: true,
  })
  @OneToOne(() => Staffer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId' })
  owner?: Staffer;

  @Exclude()
  logoAsset?: Asset = undefined;

  @ApiProperty({
    description: 'URL of the tenant logo',
    example: 'https://example.com/logo.png',
    nullable: true,
  })
  logoURL?: string;

  /** Not a column: filled from TenantPreferences so clients can format money. */
  currency?: string;

  @ApiProperty({
    description: 'Staff members of the tenant',
    type: () => [Staffer],
  })
  @OneToMany(() => Staffer, (staff) => staff.tenant)
  staff: Staffer[];

  @ApiProperty({
    description: 'Branches of the tenant',
    type: () => [Branch],
  })
  @OneToMany(() => Branch, (branch) => branch.tenant)
  branches: Branch[];

  @ApiProperty({
    description: 'Staff invitations for the tenant',
    type: () => [StaffInvitation],
  })
  @OneToMany(() => StaffInvitation, (invitation) => invitation.tenant)
  invitations: StaffInvitation[];

  @ApiProperty({
    description: 'The date when the tenant was blocked by admin',
    example: '2023-01-15T12:00:00Z',
    nullable: true,
  })
  @Column({ nullable: true })
  blockedAt?: Date;

  @ApiProperty({
    description:
      'Set when the subscription is cancelled or unpaid: the venue stops taking NEW bookings and disappears from discovery, while bookings already paid for stand. Cleared automatically on payment. Separate from blockedAt, which is an ops decision.',
    required: false,
  })
  @Column({ type: 'timestamptz', nullable: true })
  subscriptionLapsedAt?: Date;

  @ApiProperty({
    description: 'The reason provided by ops when the tenant was blocked/suspended',
    example: 'Repeated policy violations',
    nullable: true,
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  blockedReason?: string;


  @ApiProperty({
    description: 'The date when the tenant was deleted',
    example: '2023-01-15T12:00:00Z',
    nullable: true,
  })
  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @ApiProperty({
    description: 'Payment provider customer ID for subscription billing',
    example: 'cus_xxxxx',
    nullable: true,
  })
  @Column({ nullable: true })
  providerCustomerId?: string;

  @Column({
    type: 'enum',
    enumName: 'PaymentProvider',
    enum: PaymentProvider,
    default: PaymentProvider.STRIPE,
  })
  paymentProvider: PaymentProvider;

  @ApiProperty({
    description: 'Subscription',
    type: () => Subscription,
    nullable: true,
  })
  @OneToOne(() => Subscription, { onDelete: 'SET NULL' })
  subscription?: Subscription;

  @OneToOne(() => TenantPreferences, (preferences) => preferences.tenant)
  preferences?: TenantPreferences;
}
