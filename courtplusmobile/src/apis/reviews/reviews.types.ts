import { Review } from "models";
import { ApiResponse, Pagination } from "utils";

export interface PostReviewRequest {
  bookingId: string;
  comment: string;
  rating: number;
}

export interface ReviewsRequest {
  page: number;
  pageSize?: number;
  courtId: string;
}
export interface ReviewsResponse extends ApiResponse {
  items: Review[];
  pagination: Pagination;
}
