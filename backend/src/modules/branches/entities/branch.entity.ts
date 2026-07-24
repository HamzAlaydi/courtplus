import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Location } from './location.entity';
import { Court } from 'src/modules/courts/entities/court.entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';
import { Schedule } from 'src/modules/schedules/entities/schedule.entity';
import { Staffer } from 'src/modules/staff/entities/staff.entity';
import { ApiProperty } from '@nestjs/swagger';
import { MonthStats } from '../dto/month-stats.dto';
import { BranchStaffer } from 'src/modules/staff/entities/branch-staffer.entity';

export enum BranchStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  OCCUPIED = 'occupied',
  UNDER_MAINTENANCE = 'under_maintenance',
}

@Entity('branches')
@Index('branch_tenant_id_idx', ['tenantId'])
@Index('branch_status_idx', ['status'])
@Index('branch_location_id_idx', ['locationId'])
export class Branch extends BaseEntity {
  @ApiProperty({
    description: 'The name of the branch',
    example: 'Downtown Branch',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'The description of the court',
    example: 'Main tennis court with premium surface',
    nullable: true,
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'The phone number of the branch',
    example: '+1234567890',
  })
  @Column()
  phoneNumber: string;

  @ApiProperty({
    description: 'The current operational status of the branch',
    enum: BranchStatus,
    enumName: 'BranchStatus',
    example: BranchStatus.OPEN,
  })
  @Column({
    type: 'enum',
    enum: BranchStatus,
    enumName: 'BranchStatus',
  })
  status: BranchStatus;

  @ApiProperty({
    description: 'Whether the branch is visible to users',
    example: true,
  })
  @Column({ nullable: true })
  isVisible?: boolean;

  @ApiProperty({
    description: 'The ID of the tenant this branch belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  tenantId: string;

  @ApiProperty({
    description: 'The ID of the location this branch is at',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  locationId: string;

  @ApiProperty({
    description: 'The URL of the branch cover image',
    example: 'https://example.com/images/cover.jpg',
    nullable: true,
  })
  @Column({ nullable: true })
  coverUrl?: string;

  @ApiProperty({
    description: 'The URL of the branch logo',
    example: 'https://example.com/images/logo.jpg',
    nullable: true,
  })
  @Column({ nullable: true })
  logoUrl?: string;

  @ApiProperty({
    description: 'Whether the branch is bookmarked by the user',
    example: false,
  })
  isBookmarked?: boolean;

  @ApiProperty({
    description: 'The total number of bookmarks for the court',
    example: 100,
  })
  @Column({ default: 0 })
  bookmarksCount: number;

  @ApiProperty({
    description: 'The total number of bookings for the branch',
    example: 100,
  })
  @Column({ default: 0 })
  totalBookings: number;

  @ApiProperty({
    description: 'The total number of open bookings for the branch',
    example: 100,
  })
  @Column({ default: 0 })
  totalOpenBookings: number;

  @ApiProperty({
    description: 'The total revenue for the branch',
    example: 100,
  })
  @Column({ default: 0 })
  totalRevenue: number;

  @ApiProperty({
    description: 'The total number of upcoming bookings for the branch',
    example: 100,
  })
  @Column({ default: 0 })
  upcomingBookings: number;

  @ApiProperty({
    description: 'The total number of minutes booked for the branch',
    example: 100,
  })
  @Column({ default: 0 })
  minutesBooked: number;

  @ApiProperty({
    description: 'The total number of reviews for the branch',
    example: 100,
  })
  @Column({ default: 0 })
  reviewsCount: number;

  @ApiProperty({
    description: 'The average rating for the branch',
    example: 4.5,
  })
  @Column({ default: 0 })
  avgRating: number;

  @ApiProperty({
    description: 'Rating statistics including counts per star',
    example: {
      '1': 1,
      '2': 2,
      '3': 5,
      '4': 8,
      '5': 4,
    },
    additionalProperties: false,
    type: 'object',
    properties: {
      '1': { type: 'number' },
      '2': { type: 'number' },
      '3': { type: 'number' },
      '4': { type: 'number' },
      '5': { type: 'number' },
    },
  })
  @Column('jsonb', {
    default: () => '\'{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}\'',
  })
  ratingStats: Record<string, number>;

  @ApiProperty({
    description: 'The total number of posts for the branch',
    example: 100,
  })
  @Column({ default: 0 })
  postsCount: number;

  @ApiProperty({
    description: 'The total number of courts for the branch',
    example: 100,
  })
  @Column({ default: 0 })
  courtsCount: number;

  @ApiProperty({
    description: 'Monthly statistics for the branch',
    type: () => MonthStats,
    nullable: true,
  })
  monthStats?: MonthStats;

  @ApiProperty({
    description: 'The date when the branch was deleted (for soft delete)',
    nullable: true,
  })
  @DeleteDateColumn()
  deletedAt?: Date;

  @ApiProperty({
    description: 'The location details of the branch',
    type: () => Location,
  })
  @ManyToOne(() => Location, (location) => location.branches)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @ApiProperty({
    description: 'The tenant details of the branch',
    type: () => Tenant,
  })
  @ManyToOne(() => Tenant, (tenant) => tenant.branches)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ApiProperty({
    description: 'The courts belonging to this branch',
    type: () => [Court],
    isArray: true,
  })
  @OneToMany(() => Court, (court) => court.branch)
  courts: Court[];

  @ApiProperty({
    description: 'The schedule of the branch',
    type: () => Schedule,
  })
  @OneToOne(() => Schedule, (schedule) => schedule.branch)
  schedule: Schedule;

  @ApiProperty({
    description: 'Staff members assigned to this branch',
    type: () => [Staffer],
  })
  @OneToMany(() => BranchStaffer, (branchStaffer) => branchStaffer.branch)
  staff: BranchStaffer[];
}
