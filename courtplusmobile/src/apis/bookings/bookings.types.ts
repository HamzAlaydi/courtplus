import { Booking, MatchEvent } from "models";
import { ApiResponse, Pagination } from "utils";

export interface BookingsRequest {
  page: number;
  pageSize?: number;
  userId?: string;
  courtId?: string;
  startDate?: string;
  endDate?: string;
  open?: boolean;
  status?: string;
}

export interface BookingsResponse extends ApiResponse {
  items: Booking[];
  pagination: Pagination;
}

export interface CreateBookingRequest {
  courtId: string;
  startAt: string;
  duration: number;
  participants: string[];
  open?: boolean;
  paymentType: string;
  playersASide?: number;
  gender?: string;
  level?: string;
  autoAccept?: boolean;
}

export interface Payment {
  ephemeralKey: string;
  customerId: string;
  publishableKey: string;
  clientSecret: string;
}

export type CreateBookingResponse = Payment & ApiResponse;

export interface OpenBookingsRequest {
  page: number;
  pageSize?: number;
  userId?: string;
  courtId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface EnterMatchRequest {
  id: string;
}

export interface EventsRequest {
  id: string;
  page?: number;
  pageSize?: number;
}

export interface EventsResponse extends ApiResponse {
  items: MatchEvent[];
  pagination: Pagination;
}

export interface EventsPage {
  items: MatchEvent[];
  pagination?: Pagination;
}

export interface RespondMatchRequest {
  id: string;
  accept: boolean;
  participantId: string;
  rejectionReason?: string;
}

export interface RespondMatchResponse extends ApiResponse {
  paymentId: string;
  ephemeralKey: string;
  clientSecret: string;
  publishableKey: string;
  customerId: string;
}

export interface PayMatchRequest {
  id: string;
}

export interface PayMatchResponse extends ApiResponse {
  paymentId: string;
  ephemeralKey: string;
  clientSecret: string;
  publishableKey: string;
  customerId: string;
}

export interface CancelMatchRequest {
  id: string;
  reason?: string;
}

export interface JoinMatchRequest {
  id: string;
}

export interface RespondJoinRequestRequest {
  id: string;
  participantId: string;
  accept: boolean;
  rejectionReason?: string;
}

/**
 * `POST /bookings/:id/join` answers with the Stripe payload only when the
 * joiner owes money right away (a split match that auto-accepts). A whole-
 * payment match, or one whose host must approve the request first, answers
 * with an empty body, so every payment field is optional here.
 */
export interface JoinMatchResponse extends ApiResponse {
  paymentId?: string;
  ephemeralKey?: string;
  clientSecret?: string;
  publishableKey?: string;
  customerId?: string;
}
