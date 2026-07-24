import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  VersionColumn,
} from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Participant } from './participant.entity';
import { Court } from 'src/modules/courts/entities/court.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Gender, SportLevel } from 'src/modules/users/entities/enums';
import {
  PaymentStatus,
  PaymentType,
} from 'src/modules/payments/entities/payment.entity';
import { Post } from 'src/modules/posts/entities/post.entity';
import { BookingEvent } from './event.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Staffer } from 'src/modules/staff/entities/staff.entity';

export enum BookingStatus {
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
}

@Entity('bookings')
@Index('idx_booking_userId', ['userId'])
@Index('idx_booking_courtId', ['courtId'])
@Index('idx_booking_status', ['status'])
@Index('idx_booking_dates', ['startDate', 'endDate'])
@Index('idx_booking_court_dates', ['courtId', 'startDate'])
@Index('idx_booking_status_dates', ['status', 'startDate', 'endDate'])
@Index('idx_booking_open', ['open'])
@Index('idx_booking_created_at', ['createdAt'])
export class Booking extends BaseEntity {
  @ApiProperty({
    description: 'User ID who created the booking',
    required: false,
  })
  @Column('uuid', { nullable: true })
  userId?: string;

  @ApiProperty({
    description: 'Staff ID who created the booking',
    required: false,
  })
  @Column('uuid', { nullable: true })
  staffId?: string;

  @ApiProperty({
    description: 'Court ID where the booking will be played',
    required: false,
  })
  @Column('uuid', { nullable: true })
  courtId?: string;

  @ApiProperty({ description: 'Start date and time of the booking' })
  @Column()
  startDate: Date;

  @ApiProperty({ description: 'End date and time of the booking' })
  @Column()
  endDate: Date;

  @ApiProperty({
    description: 'Whether the booking is open for joining',
    default: false,
  })
  @Column({ default: false })
  open: boolean;

  @ApiProperty({ description: 'Duration of the booking in minutes' })
  @Column()
  duration: number;

  @ApiProperty({ description: 'Hourly rate for the court' })
  @Column()
  hourlyRate: number;

  @ApiProperty({
    description: 'Currency code for the booking from tenant settings',
    example: 'USD',
  })
  @Column({ default: 'USD' })
  currency: string;

  @ApiProperty({
    description: 'Gender restriction for the booking',
    enum: Gender,
    required: false,
  })
  @Column({
    type: 'enum',
    enum: Gender,
    enumName: 'Gender',
    nullable: true,
  })
  gender?: Gender;

  @ApiProperty({
    description: 'Sport level requirement for the booking',
    enum: SportLevel,
    required: false,
  })
  @Column({
    type: 'enum',
    enum: SportLevel,
    enumName: 'SportLevel',
    nullable: true,
  })
  level?: SportLevel;

  @ApiProperty({
    description: 'Total amount for the booking',
    type: 'number',
    format: 'float',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ApiProperty({
    description: 'Reason for booking cancellation',
    required: false,
  })
  @Column({ nullable: true })
  cancellationReason?: string;

  @ApiProperty({
    description: 'Payment type for the booking',
    enum: PaymentType,
  })
  @Column({
    type: 'enum',
    enumName: 'PaymentType',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    enumName: 'PaymentStatus',
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: BookingStatus,
    enumName: 'BookingStatus',
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @ApiProperty({ description: 'Number of players on A side', required: false })
  @Column({ nullable: true })
  playersASide?: number;

  @ApiProperty({
    description:
      'Whether an open match require booking creator to approve join requests',
    required: false,
  })
  @Column({ nullable: true })
  autoAccept?: boolean;

  @ApiProperty({
    description: 'Version number for optimistic locking',
    required: false,
  })
  @VersionColumn()
  version: number;

  @ApiProperty({ type: () => User, required: false })
  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ApiProperty({ type: () => Staffer, required: false })
  @ManyToOne(() => Staffer, (staff) => staff.bookings)
  @JoinColumn({ name: 'staffId' })
  staff?: Staffer;

  @ApiProperty({ type: () => [Participant] })
  @OneToMany(() => Participant, (participant) => participant.booking)
  participants: Participant[];

  @ApiProperty({ type: () => Court })
  @ManyToOne(() => Court)
  @JoinColumn({ name: 'courtId' })
  court: Court;

  @ApiProperty({ type: () => [Post] })
  @OneToMany(() => Post, (post) => post.booking)
  posts: Post[];

  @ApiProperty({ type: () => [BookingEvent] })
  @OneToMany(() => BookingEvent, (event) => event.booking)
  events: BookingEvent[];

  @ApiProperty({ type: () => [Review] })
  @OneToMany(() => Review, (review) => review.booking)
  reviews: Review[];

  @ApiProperty({
    description: 'Review for the booking for the current user',
    type: () => Review,
    required: false,
  })
  review: Review;
}
