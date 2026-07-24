import { User } from "models";
import { ApiResponse, Pagination } from "utils";

export interface GetUsersRequest {
  page: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface GetUsersResponse extends ApiResponse {
  items: User[];
  pagination: Pagination;
}

export interface GetUserByIdRequest {
  id: string;
}
