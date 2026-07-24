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
};
