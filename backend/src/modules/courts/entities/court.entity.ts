import { moneyTransformer } from 'src/common/money.transformer';
import { BaseEntity } from 'src/common/base-entity';
import { Branch } from 'src/modules/branches/entities/branch.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Schedule } from 'src/modules/schedules/entities/schedule.entity';
import { Location } from 'src/modules/branches/entities/location.entity';
import { Sport } from 'src/modules/users/entities/enums';
import { ApiProperty } from '@nestjs/swagger';
import { Asset } from 'src/modules/assets/entities/asset.entity';
export enum CourtSurface {
  GRASS = 'grass',
  HARD = 'hard',
}

export enum CourtStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  PENDING_PAYMENT = 'pending_payment',
  PENDING_APPROVAL = 'pending_approval',
  CHANGES_REQUESTED = 'changes_requested',
  SUSPENDED = 'suspended',
}

@Entity('courts')
@Index('court_branch_id_idx', ['branchId'])
@Index('court_surface_idx', ['surface'])
@Index('court_status_idx', ['status'])
@Index('court_location_id_idx', ['locationId'])
export class Court extends BaseEntity {
  @ApiProperty({
    description: 'The name of the court',
    example: 'Center Court',
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
    description: 'The ID of the branch this court belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  branchId: string;

  @ApiProperty({
    description: 'The length of the court in meters',
    example: 23.77,
  })
  @Column('float')
  length: number;

  @ApiProperty({
    description: 'The width of the court in meters',
    example: 10.97,
  })
  @Column('float')
  width: number;

  @ApiProperty({
    description: 'The size category of the court',
    example: 'Standard',
    nullable: true,
    required: false,
  })
  @Column({ nullable: true })
  size?: string;

  @ApiProperty({
    description: 'The surface type of the court',
    enum: CourtSurface,
    enumName: 'CourtSurface',
    example: CourtSurface.HARD,
  })
  @Column({
    type: 'enum',
    enumName: 'CourtSurface',
    enum: CourtSurface,
  })
  surface: CourtSurface;

  @ApiProperty({
    description: 'The current availability status of the court',
    enum: CourtStatus,
    enumName: 'CourtStatus',
    example: CourtStatus.AVAILABLE,
  })
  @Column({
    type: 'enum',
    enum: CourtStatus,
    enumName: 'CourtStatus',
  })
  status: CourtStatus;

  @ApiProperty({
    description: 'The average rating of the court',
    example: 4.5,
  })
  @Column('float', { default: 0 })
  avgRating: number;

  @ApiProperty({
    description: 'The total number of reviews',
    example: 10,
  })
  @Column('int', { default: 0 })
  reviewsCount: number;

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
    description: 'The ID of the location this court is at',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
    required: false,
  })
  @Column('uuid', { nullable: true })
  locationId?: string;

  @ApiProperty({
    description: 'The hourly rate of the court',
    example: 100,
  })
  @Column('float')
  hourlyRate: number;

  @ApiProperty({
    description: 'The currency code for the court pricing from tenant settings',
    example: 'USD',
  })
  currency?: string;

  @ApiProperty({
    description: 'The sport this court is for',
    enum: Sport,
    enumName: 'Sport',
    example: Sport.TENNIS,
  })
  @Column({ type: 'enum', enum: Sport, enumName: 'Sport' })
  sport: Sport;

  @ApiProperty({
    description: 'Whether the court is air conditioned',
    example: false,
  })
  @Column({ default: false })
  isAirConditioned: boolean;

  @ApiProperty({
    description: 'Whether the court is women only: fully enclosed and private',
    example: false,
  })
  @Column({ default: false })
  isWomenOnly: boolean;

  @ApiProperty({
    description: 'The distance to the court from the user',
    example: 10,
  })
  distance?: number;

  @ApiProperty({
    description: 'The main asset of the court',
    example: 'https://example.com/court.jpg',
  })
  mainAsset?: string;

  @ApiProperty({
    description: 'Whether the court is bookmarked by the user',
    example: false,
  })
  isBookmarked?: boolean;

  @ApiProperty({
    description: 'The available days of the court',
    example: [1, 5, 10, 12, 15, 20, 22, 25, 27, 30],
  })
  unavailableDays?: number[];

  @ApiProperty({
    description: 'The minimum duration of the court',
    example: 30,
  })
  @Column({ nullable: true })
  minDuration: number = 30;

  @ApiProperty({
    description: 'The total number of bookmarks for the court',
    example: 100,
  })
  @Column({ default: 0 })
  bookmarksCount: number;

  @ApiProperty({
    description: 'The total number of bookings for the court',
    example: 100,
  })
  @Column({ default: 0 })
  totalBookings: number;

  @ApiProperty({
    description: 'The total number of open bookings for the court',
    example: 100,
  })
  @Column({ default: 0 })
  totalOpenBookings: number;

  @ApiProperty({
    description: 'The total revenue for the court',
    example: 100,
  })
  @Column('numeric', { precision: 14, scale: 2, default: 0, transformer: moneyTransformer })
  totalRevenue: number;

  @ApiProperty({
    description: 'The total number of bookings for the court',
    example: 100,
  })
  @Column({ default: 0 })
  upcomingBookings: number;

  @ApiProperty({
    description: 'The total revenue for the court in the current month',
    example: 100,
  })
  currentMonthRevenue: number;

  @ApiProperty({
    description:
      'The total number of bookings for the court in the current month',
    example: 100,
  })
  currentMonthBookings: number;

  @ApiProperty({
    description: 'The total number of minutes booked for the court',
    example: 100,
  })
  @Column({ default: 0 })
  minutesBooked: number;

  @ApiProperty({
    description: 'The total number of posts for the court',
    example: 100,
  })
  @Column({ default: 0 })
  postsCount: number;

  @ApiProperty({
    description: 'The reason provided by ops when changes were requested or the court was suspended',
    example: 'Court images are outdated',
    nullable: true,
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @ApiProperty({
    description: 'The date when the court was submitted for ops approval',
    nullable: true,
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @ApiProperty({
    description: 'The date when the court was reviewed by ops',
    nullable: true,
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @ApiProperty({
    description: 'The ID of the ops staff member who reviewed the court',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
    required: false,
  })
  @Column('uuid', { nullable: true })
  reviewedByStaffId?: string;

  @ApiProperty({
    description: 'The date when the court was deleted (for soft delete)',
    nullable: true,
    required: false,
  })
  @DeleteDateColumn()
  deletedAt?: Date;

  @ApiProperty({
    description: 'The branch this court belongs to',
    type: () => Branch,
  })
  @ManyToOne(() => Branch, (branch) => branch.courts)
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({
    description: 'The location details of the court',
    type: () => Location,
  })
  @ManyToOne(() => Location, (location) => location.courts)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @ApiProperty({
    description: 'The schedule of the court',
    type: () => Schedule,
  })
  @OneToOne(() => Schedule, (schedule) => schedule.court)
  schedule: Schedule;

  @ApiProperty({
    description: 'The assets of the court',
    type: () => [Asset],
    isArray: true,
  })
  assets: Asset[];
}
