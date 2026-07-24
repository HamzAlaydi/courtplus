import { User } from "models";
import { ApiResponse } from "utils";

export interface LoginRequest {
  phoneNumber: string;
  code: string;
  recover?: boolean;
}

export interface LoginResponse extends ApiResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresVerification?: boolean;
}

export interface SendCodeRequest {
  phoneNumber: string;
  purpose?: "login" | "signup";
}

export interface SocialLoginRequest {
  token: string;
  recover?: boolean;
}

export interface CheckUsernameRequest {
  username: string;
}

export interface CheckUsernameResponse extends ApiResponse {
  available: boolean;
  suggestions?: string[];
}

export interface SignupRequest {
  phoneNumber: string;
  code: string;
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth?: string;
  gender: string;
}

export interface AuthenticationResponse extends ApiResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
