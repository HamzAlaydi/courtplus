import { Court } from "./Court";
import { Review } from "./Review";

export enum BookingStatus {
  ENTER = "enter",
  CAPTURE = "capture",
  NOT_ENTERED = "notEntered",
  REVIEW = "review",
}

export enum PaymentType {
  WHOLE = "whole",
  SPLIT = "split",
}
export enum PaymentStatus {
  PAID = "paid",
  COMPLETED = "completed",
  PENDING = "pending",
}

export enum MatchStatus {
  CANCELLED = "cancelled",
  ACCEPTED = "accepted",
  PENDING = "pending",
  AWAITING_HOST = "awaiting_host",
  COMPLETED = "completed",
}

export enum ParticipantStatus {
  ACCEPTED = "accepted",
  PENDING = "pending_response",
  PENDING_PAYMENT = "pending_payment",
  ENTERED = "entered",
  READY = "ready",
}

export type Participant = {
  createdAt: string;
  updatedAt: string;
  id: string;
  userId: string;
  matchId: string;
  isCreator: boolean;
  status: ParticipantStatus;
  paymentId: string;
  cancellationReason: string;
  rejectionReason: string;
  paymentStatus: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string;
    username: string;
  };
};

export type Booking = {
  createdAt: string;
  updatedAt: string;
  id: string;
  userId: string;
  courtId: string;
  startDate: string;
  /** IANA zone of the court; API top-level field. */
  timeZone?: string;
  endDate: string;
  open: boolean;
  duration: number;
  hourlyRate: number;
  totalAmount: string;
  cancellationReason: string;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  status: MatchStatus;
  court: Court;
  participants: Participant[];
  review?: Review;
  /**
   * Open-match fields. The API has always returned these; without them on the
   * model the match card could not show WHY a join would be refused, so
   * "Book now" answered with a level/gender rejection the player had no way
   * to see coming.
   */
  level?: string;
  gender?: string;
  playersASide?: number;
  /** Frozen seat count the organiser's share was divided by. */
  splitSeats?: number;
  autoAccept?: boolean;
};
