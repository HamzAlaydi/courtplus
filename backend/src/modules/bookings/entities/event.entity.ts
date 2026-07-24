import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity, Index, ManyToOne, DeleteDateColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum BookingEventType {
  CREATED = 'created',
  STARTED = 'started',
  ENDED = 'ended',
  PARTICIPANT_ENTERED = 'participant_entered',
  PARTICIPANT_CANCELLED = 'participant_cancelled',
  PARTICIPANT_REMOVED = 'participant_removed',
  PARTICIPANT_ADDED = 'participant_added',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_INVITATION_ACCEPTED = 'participant_invitation_accepted',
  PARTICIPANT_INVITATION_REJECTED = 'participant_invitation_rejected',
  PARTICIPANT_PAYMENT_COMPLETED = 'participant_payment_completed',
  PARTICIPANT_JOIN_REQUEST_SUBMITTED = 'participant_join_request_submitted',
  PARTICIPANT_JOIN_REQUEST_APPROVED = 'participant_join_request_approved',
  PARTICIPANT_JOIN_REQUEST_REJECTED = 'participant_join_request_rejected',
  CANCELLED = 'cancelled',
  MOMENT_POSTED = 'moment_posted',
  PAYMENT_COMPLETED = 'payment_completed',
}

@Entity('booking_events')
@Index('idx_booking_id_index', ['bookingId'])
export class BookingEvent extends BaseEntity {
  @ApiProperty({
    description: 'ID of the booking this event belongs to',
  })
  @Column('uuid')
  bookingId: string;

  @ApiProperty({
    description: 'ID of the user who triggered this event',
    required: false,
  })
  @Column('uuid', { nullable: true })
  userId?: string;

  @ApiProperty({
    description: 'Additional data associated with the event',
    required: false,
  })
  @Column('jsonb', { nullable: true })
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Type of booking event',
    enum: BookingEventType,
  })
  @Column({
    type: 'enum',
    enumName: 'BookingEvent',
    enum: BookingEventType,
  })
  event: BookingEventType;

  @ApiProperty({
    description: 'Soft delete timestamp for events related to removed/rejected participants',
    required: false,
  })
  @DeleteDateColumn()
  deletedAt?: Date;

  @ApiProperty({
    description: 'The booking this event belongs to',
    type: () => Booking,
  })
  @ManyToOne(() => Booking, (booking) => booking.events, {
    onDelete: 'CASCADE',
  })
  booking: Booking;

  @ApiProperty({
    description: 'The user who triggered this event',
    type: () => User,
    required: false,
  })
  @ManyToOne(() => User, (user) => user.bookingEvents)
  user?: User;
}
