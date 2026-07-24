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
}

export interface EventsResponse extends ApiResponse {
  items: MatchEvent[];
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
