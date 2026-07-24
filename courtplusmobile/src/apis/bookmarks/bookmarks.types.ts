import { Bookmark } from "models";
import { ApiResponse, Pagination } from "utils";

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

export interface PostBookmarkRequest {
  resourceId: string;
  type: "court" | "branch";
}

export interface PostBookmarkResponse extends ApiResponse {
  id: string;
  userId: string;
  resourceId: string;
  resourceType: "court" | "branch";
  createdAt: string;
  updatedAt: string;
}
