import { Booking } from './entities/booking.entity';

import { Participant } from './entities/participant.entity';
import { Post } from '../posts/entities/post.entity';



export interface BookingCreatedEventPayload {
  booking: Booking;
}

export interface BookingUpdatedEventPayload {
  booking: Booking;
}

export interface BookingCancelledEventPayload {
  booking: Booking;
}

export interface ParticipantRespondedEventPayload {
  participant: Participant;
  userId: string;
  rejectionReason?: string;
}


export interface ParticipantJoinedEventPayload {
  participant: Participant;
  rejectionReason?: string;
}

export interface ParticipantJoinRequestSubmittedEventPayload {
  participant: Participant;
  requesterName: string;
}

export interface ParticipantEnteredEventPayload {
  participant: Participant;
}

export interface MomentPostedEventPayload {
  booking: Booking;
  post: Post;
}

export interface BookingPaymentCompletedEventPayload {
  booking: Booking;
  userId: string;
}

export interface BookingEndedEventPayload {
  booking: Booking;
}

export interface BookingPaymentCapturedEventPayload {
  booking: Booking;
  userId: string;
  paymentId: string;
  amount: number;
  currency?: string;
}

export interface BookingPaymentRefundedEventPayload {
  bookingId?: string;
  userId: string;
  paymentId: string;
  amount: number;
  currency?: string;
}
