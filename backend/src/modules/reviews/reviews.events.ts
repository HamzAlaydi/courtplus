import { Review } from './entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';

export enum ReviewEvent {
  REVIEW_CREATED = 'review.created',
  REVIEW_DELETED = 'review.deleted',
}

export interface ReviewEventPayload {
  review: Review;
  booking: Booking;
}
