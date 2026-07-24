import { Notification } from "models";
import { ApiResponse, Pagination } from "utils";

export interface NotificationResponse extends ApiResponse {
  items: Notification[];
  pagination: Pagination;
}

export interface NotificationSettingsResponse extends ApiResponse {
  followers: boolean;
  likes: boolean;
  openMatches: boolean;
  matchActivity: boolean;
  updates: boolean;
}
