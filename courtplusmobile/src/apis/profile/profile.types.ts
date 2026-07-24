import { FriendShip, Post, User } from "models";
import { ApiResponse, Pagination } from "utils";

export interface GetFriendshipsRequest {
  page: number;
  pageSize?: number;
  userId?: string;
  type?: "followers" | "following";
  search?: string;
}

export interface GetFriendshipsResponse extends ApiResponse {
  items: FriendShip[];
  pagination: Pagination;
}

export interface GetPostsRequest {
  page: number;
  pageSize?: number;
  bookingId?: string;
  userId?: string;
  courtId?: string;
}

export interface GetPostsResponse extends ApiResponse {
  items: Post[];
  pagination: Pagination;
}

export interface UpdatePhoneRequest {
  phoneNumber: string;
}

export interface VerifyPhoneRequest {
  phoneNumber: string;
  code: string;
}

export interface EditProfileRequest {
  user: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    gender?: string;
    dateOfBirth?: string;
    username?: string;
    avatarAssetId?: string;
    coverAssetId?: string;
    phone?: string;
  };
  onUploadProgress?: (progress: number) => void;
}

export interface AddSportsRequest {
  name: string;
  level: string;
  timePreference: string;
}
