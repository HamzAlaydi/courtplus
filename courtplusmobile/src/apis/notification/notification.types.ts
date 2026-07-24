import { Notification } from "models";
import { ApiResponse, Pagination } from "utils";

export interface NotificationSettings {
  followers: boolean;
  likes: boolean;
  openBookings: boolean;
  bookingActivity: boolean;
  updates: boolean;
  nearbyCourts: boolean;
}

export interface UpdateNotificationSettingsRequest {
  userId: string;
  language: string;
  currency: string;
  notifications: {
    followers: boolean;
    likes: boolean;
    openBookings: boolean;
    bookingActivity: boolean;
    updates: boolean;
    nearbyCourts: boolean;
  };
}

export interface NotificationSettingsResponse extends ApiResponse {
  userId: string;
  language: string;
  currency: string;
  notifications: {
    followers: boolean;
    likes: boolean;
    openBookings: boolean;
    bookingActivity: boolean;
    updates: boolean;
    nearbyCourts: boolean;
  };
}

export interface NotificationRequest {
  page: number;
  pageSize?: number;
}

export interface NotificationResponse extends ApiResponse {
  items: Notification[];
  pagination: Pagination;
}
