import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { BaseEntity } from 'src/common/base-entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ParticipantStatus {
  PENDING_RESPONSE = 'pending_response',
  PENDING_PAYMENT = 'pending_payment',
  PENDING_APPROVAL = 'pending_approval',
  READY = 'ready',
  ENTERED = 'entered',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
}
@Entity('participants')
@Index(['bookingId', 'userId'], { unique: true })
export class Participant extends BaseEntity {
  @ApiProperty({
    description: 'The ID of the user participating in the booking',
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({ description: 'The ID of the booking' })
  @Column('uuid')
  bookingId: string;

  @ApiProperty({
    description: 'Whether this participant is the creator of the booking',
    nullable: true,
  })
  @Column({ nullable: true })
  isCreator?: boolean;

  @ApiProperty({
    description: 'Current status of the participant',
    enum: ParticipantStatus,
  })
  @Column({
    enum: ParticipantStatus,
    enumName: 'ParticipantStatus',
    type: 'enum',
  })
  status: ParticipantStatus;

  @ApiProperty({ description: 'ID of the associated payment', required: false })
  @Column({ nullable: true })
  paymentId?: string;

  @ApiProperty({
    description: 'Reason for cancellation if the participant cancelled',
    required: false,
  })
  @Column({ nullable: true })
  cancellationReason?: string;

  @ApiProperty({
    description: 'The associated user details',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.participants)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    description: 'The associated booking details',
    type: () => Booking,
  })
  @ManyToOne(() => Booking, (booking) => booking.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ApiProperty({
    description: 'The associated payment details',
    type: () => Payment,
    required: false,
  })
  @OneToOne(() => Payment, (payment) => payment.participant)
  @JoinColumn({ name: 'paymentId' })
  payment?: Payment;
}
