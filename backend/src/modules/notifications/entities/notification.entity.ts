import { BaseEntity } from 'src/common/base-entity';
import { Branch } from 'src/modules/branches/entities/branch.entity';
import { Court } from 'src/modules/courts/entities/court.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Post } from 'src/modules/posts/entities/post.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';

export enum NotificationType {
  FOLLOW = 'follow',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_INVITATION_ACCEPTED = 'booking_invitation_accepted',
  BOOKING_INVITATION_REJECTED = 'booking_invitation_rejected',
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_INVITATION = 'booking_invitation',
  BOOKING_ENTERED = 'booking_entered',
  BOOKING_JOINED = 'booking_joined',
  BOOKING_CREATED = 'booking_created',
  BOOKING_PARTICIPANT_REMOVED = 'booking_participant_removed',
  BOOKING_PARTICIPANT_ADDED = 'booking_participant_added',
  BOOKING_PARTICIPANT_CANCELLED = 'booking_participant_cancelled',
  BOOKING_STARTED = 'booking_started',
  BOOKING_ENDED = 'booking_ended',
  BOOKING_JOIN_REQUEST_SUBMITTED = 'booking_join_request_submitted',
  BOOKING_JOIN_REQUEST_APPROVED = 'booking_join_request_approved',
  BOOKING_JOIN_REQUEST_REJECTED = 'booking_join_request_rejected',
  REVIEW_ADDED = 'review_added',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  REFUND_SUCCEEDED = 'refund_succeeded',
  REFUND_FAILED = 'refund_failed',
  PAYMENT_RELEASED = 'payment_released',
  RATE_REMINDER = 'rate_reminder',
  MOMENT_POSTED = 'moment_posted',
  POST_LIKE = 'post_like',
  REPORT_CREATED = 'report_created',
  COURT_PENDING_PAYMENT = 'court_pending_payment',
  COURT_PENDING_APPROVAL = 'court_pending_approval',
  COURT_APPROVED = 'court_approved',
  COURT_CHANGES_REQUESTED = 'court_changes_requested',
  COURT_RESUBMITTED = 'court_resubmitted',
  COURT_SUSPENDED = 'court_suspended',
  COURT_UNSUSPENDED = 'court_unsuspended',
  BRANCH_SUSPENDED = 'branch_suspended',
  BRANCH_UNSUSPENDED = 'branch_unsuspended',
  TENANT_SUSPENDED = 'tenant_suspended',
  TENANT_UNSUSPENDED = 'tenant_unsuspended',
  TENANT_UNSUSPEND_REQUESTED = 'tenant_unsuspend_requested',
  SUBSCRIPTION_PAYMENT_FAILED = 'subscription_payment_failed',
  SUBSCRIPTION_PAYMENT_SUCCEEDED = 'subscription_payment_succeeded',
  TENANT_UNSUSPEND_DENIED = 'tenant_unsuspend_denied',
  PAYOUT_REQUESTED = 'payout_requested',
  PAYOUT_APPROVED = 'payout_approved',
  PAYOUT_REJECTED = 'payout_rejected',
  PAYOUT_COMPLETED = 'payout_completed',
  PAYOUT_FAILED = 'payout_failed',

}

export class Relations {
  @ApiProperty({
    type: () => User,
    required: false,
    description: 'The user associated with the notification',
  })
  user?: User;

  @ApiProperty({
    type: () => Court,
    required: false,
    description: 'The court associated with the notification',
  })
  court?: Court;

  @ApiProperty({
    type: () => Branch,
    required: false,
    description: 'The branch associated with the notification',
  })
  branch?: Branch;

  @ApiProperty({
    type: () => Booking,
    required: false,
    description: 'The booking associated with the notification',
  })
  booking?: Booking;

  @ApiProperty({
    type: () => Review,
    required: false,
    description: 'The review associated with the notification',
  })
  review?: Review;

  @ApiProperty({
    type: () => Post,
    required: false,
    description: 'The post associated with the notification',
  })
  post?: Post;
}

export interface NotificationData {
  userId?: string;
  courtId?: string;
  branchId?: string;
  bookingId?: string;
  reviewId?: string;
  postId?: string;
  kind?: string;
  reason?: string;
  courtName?: string;
  branchName?: string;
  tenantId?: string;
  tenantName?: string;
  message?: string;
  payoutId?: string;
  /** Major units, already formatted (e.g. "1500.00") — numeric(14,2) reads back as a string. */
  amount?: string | number;
  currency?: string;
}

@Entity('notifications')
@Index(['userId'])
@Index(['userId', 'type'])
@Index(['userId', 'readAt'])
export class Notification extends BaseEntity {
  @ApiProperty({
    enum: NotificationType,
    description: 'The type of notification',
  })
  @Column({
    type: 'enum',
    enum: NotificationType,
    enumName: 'NotificationType',
  })
  type: NotificationType;

  @ApiProperty({
    description: 'The ID of the user who will receive the notification',
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    description: 'The ID of the resource that triggered the notification',
  })
  @Column('uuid', { nullable: true })
  resourceId?: string;

  @ApiProperty({
    description: 'The count of the notification',
  })
  @Column({ nullable: true })
  count?: number;

  @ApiProperty({
    type: 'object',
    description: 'Additional data specific to the notification type',
    additionalProperties: true,
  })
  @Column({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @ApiProperty({
    required: false,
    description: 'Image associated with the notification',
  })
  image?: string;

  @ApiProperty({
    required: false,
    description: 'Title of the notification',
  })
  title?: string;

  @ApiProperty({
    required: false,
    description: 'Content of the notification',
  })
  content?: string;

  @ApiProperty({
    required: false,
    description: 'Timestamp when the notification was read',
  })
  @Column({ nullable: true })
  readAt?: Date;

  @ApiProperty({
    type: () => Relations,
    description: 'Related entities associated with the notification',
  })
  relations: Relations;
}
