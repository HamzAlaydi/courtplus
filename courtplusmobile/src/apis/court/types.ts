import { Bookmark, Review, Slot } from "models";
import { Court } from "src/models/Court";
import { ApiResponse, Pagination } from "utils";

export interface CourtsRequestParams {
  page: number;
  pageSize?: number;
  search?: string;
  branchId?: string;
  sport?: string;
  placeId?: string;
  lng?: number;
  lat?: number;
  radius?: number;
  currentLocation: string;
  sortBy?: string;
  sortDirection?: string;
  minRating?: number;
  startAt?: string;
  duration?: number;
}

export interface CourtsResponse extends ApiResponse {
  items: Court[];
  pagination: Pagination;
}

export interface CourtRequestIdRequest {
  id: string;
}

export interface BookmarkRequest {
  resourceId: string;
  type: string;
}

export interface GetBookmarkRequest {
  page: number;
  pageSize?: number;
  type?: ("court" | "user" | "branch")[];
  search?: string;
}

export interface GetBookmarkResponse extends ApiResponse {
  items: Bookmark[];
  pagination: Pagination;
}

export interface GetCourtAvailabilityRequest {
  id: string;
  date?: string;
  month?: string;
}

export interface GetCourtAvailabilityResponse extends ApiResponse {
  availableDays?: number[];
  unavailableDays?: number[];
  slots?: Slot[];
}

export interface ReviewsRequestParams {
  courtId: string;
  page: number;
  pageSize?: number;
}

export interface ReviewsResponse extends ApiResponse {
  items: Review[];
  pagination: Pagination;
}
