import { Court, Slot } from "models";
import { ApiResponse, Pagination } from "utils";

export interface CourtsRequest {
  page: number;
  pageSize?: number;
  search?: string;
  branchId?: string;
  sport?: string;
  placeId?: string;
  lng?: number;
  lat?: number;
  radius?: number;
  currentLocation?: string;
  sortBy?: string;
  sortDirection?: string;
}

/** Default geo-filter radius in meters when the device location is known. */
export const DEFAULT_COURTS_RADIUS = 500000;

export interface CourtsResponse extends ApiResponse {
  items: Court[];
  pagination: Pagination;
}

export interface CourtRequestIdRequest {
  id: string;
}

export interface BranchRequestIdRequest {
  id: string;
  includeCourts?: boolean;
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
