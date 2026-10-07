import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { LoginResponse } from "./types";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ACCESS_KEY = "ops.accessToken";
const REFRESH_KEY = "ops.refreshToken";
const USER_KEY = "ops.user";

function decodeExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export const tokenStore = {
  get accessToken() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },
  get user() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set(accessToken: string, refreshToken: string, user?: unknown) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user !== undefined) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

const client = axios.create({ baseURL: API_URL });

// --- Refresh token queue (mirrors dashboard/src/service/axiosInstance.js) ---
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = tokenStore.refreshToken;
  if (!refreshToken) {
    tokenStore.clear();
    return null;
  }
  if (isRefreshing) {
    return new Promise((resolve) => refreshSubscribers.push(resolve));
  }
  isRefreshing = true;
  try {
    const { data } = await axios.post<LoginResponse>(
      `${API_URL}/auth/staff/refresh-token`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );
    if (!data?.accessToken || !data?.refreshToken) {
      tokenStore.clear();
      onRefreshed(null);
      return null;
    }
    tokenStore.set(data.accessToken, data.refreshToken, data.user ?? tokenStore.user);
    onRefreshed(data.accessToken);
    return data.accessToken;
  } catch {
    tokenStore.clear();
    onRefreshed(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

client.interceptors.request.use(async (config) => {
  if (config.url?.startsWith("/auth")) return config;

  let token = tokenStore.accessToken;
  if (token) {
    const exp = decodeExp(token);
    const now = Math.floor(Date.now() / 1000);
    if (exp && exp - now < 60) {
      token = await refreshAuthToken();
      if (!token) {
        // Expired/revoked session: go to the login page instead of leaving
        // every page on a permanent skeleton.
        tokenStore.clear();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(new Error("Token refresh failed"));
      }
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.startsWith("/auth")
    ) {
      original._retry = true;
      const token = await refreshAuthToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      }
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/** Friendly English messages for backend error codes (ops console is English-only). */
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Incorrect email or password.",
  INVALID_PASSWORD: "Incorrect password.",
  INCORRECT_CURRENT_PASSWORD: "The current password is incorrect.",
  NEW_PASSWORD_SAME_AS_CURRENT: "New password must be different from the current one.",
  EMAIL_MUST_BE_DIFFERENT: "The new email must be different from the current one.",
  NO_PENDING_EMAIL_CHANGE: "There is no pending email change.",
  INVALID_CODE: "The verification code is incorrect.",
  CODE_EXPIRED: "The verification code has expired. Please request a new one.",
  INVALID_TOKEN: "This link is invalid or has expired.",
  INVALID_REFRESH_TOKEN: "Session expired. Please sign in again.",
  REFRESH_TOKEN_REQUIRED: "Session expired. Please sign in again.",
  SESSION_NOT_FOUND: "Session expired. Please sign in again.",
  EMAIL_ALREADY_EXISTS: "This email is already in use.",
  EMAIL_NOT_FOUND: "No account was found with this email.",
  ACCOUNT_ALREADY_EXISTS: "An account with these details already exists.",
  ACCOUNT_DELETED: "This account has been deleted.",
  TOO_MANY_REQUESTS: "Too many attempts. Please wait a moment and try again.",
  FORBIDDEN: "You don't have permission to do this.",
  NOT_ALLOWED: "This action is not allowed.",
  INVALID_PHONE_NUMBER: "Enter a valid phone number.",
  PHONE_NUMBER_ALREADY_EXISTS: "This phone number is already in use.",
  PHONE_NUMBER_ALREADY_VERIFIED: "This phone number is already verified.",
  PHONE_NUMBER_NOT_VERIFIED: "The phone number is not verified.",
  PHONE_NUMBER_MUST_BE_DIFFERENT: "The new phone number must be different from the current one.",
  STAFF_NOT_FOUND: "Staff member not found.",
  STAFF_EMAIL_ALREADY_EXISTS: "A staff member with this email already exists.",
  INVALID_INVITATION: "This invitation is invalid or has expired.",
  INVITATION_NOT_FOUND_OR_USED: "This invitation is invalid or has already been used.",
  CANNOT_INVITE_SELF: "You can't invite yourself.",
  CANNOT_INVITE_OWNER: "The owner can't be invited.",
  CANNOT_MODIFY_OWNER_ROLE: "The owner's role can't be changed.",
  CANNOT_ASSIGN_OWNER_TO_BRANCH: "The owner can't be assigned to a branch.",
  CANNOT_ASSIGN_SELF: "You can't assign yourself.",
  ROLE_REQUIRED: "Please choose a role.",
  OWNER_CANNOT_DELETE_ACCOUNT: "The owner account can't be deleted.",
  CANNOT_MODIFY_LAST_SUPER_ADMIN: "The last super admin can't be modified.",
  TENANT_NOT_FOUND: "Tenant not found.",
  TENANT_ALREADY_BLOCKED: "This tenant is already suspended.",
  TENANT_NOT_BLOCKED: "This tenant is not suspended.",
  UNSUSPEND_REQUEST_ALREADY_EXISTS: "An unsuspend request is already pending.",
  UNSUSPEND_REQUEST_NOT_FOUND: "Unsuspend request not found.",
  BRANCH_NOT_FOUND: "Branch not found.",
  BRANCH_CREATION_NOT_ALLOWED: "Branch creation is not allowed on the current plan.",
  INVALID_BRANCH_STATUS_TRANSITION: "This branch status change is not allowed.",
  COURT_NOT_FOUND: "Court not found.",
  COURT_CREATION_NOT_ALLOWED: "Court creation is not allowed on the current plan.",
  INVALID_COURT_STATUS_TRANSITION: "This court status change is not allowed.",
  LOCATION_NOT_FOUND: "Location not found.",
  SCHEDULE_NOT_FOUND: "Schedule not found.",
  OVERLAPPING_AVAILABILITIES: "Working hours overlap. Please review the schedule.",
  INVALID_TIME_FORMAT: "Invalid time format.",
  RESOURCE_NOT_FOUND: "The requested resource was not found.",
  ASSET_NOT_FOUND: "Asset not found.",
  ASSET_NOT_OWNED: "This asset doesn't belong to this account.",
  EXPLICIT_CONTENT_DETECTED: "The uploaded image was rejected due to explicit content.",
  MIMETYPE_REQUIRED: "Unsupported file type.",
  SUBSCRIPTION_NOT_FOUND: "No subscription was found.",
  SUBSCRIPTION_ALREADY_EXISTS: "An active subscription already exists.",
  SUBSCRIPTION_REQUIRED: "An active subscription is required.",
  INVALID_SUBSCRIPTION_STATE: "This action isn't available for the current subscription state.",
  PAYMENT_METHOD_REQUIRED: "A payment method is required first.",
  INSUFFICIENT_BALANCE: "Insufficient balance.",
  PAYOUT_ACCOUNT_NOT_CONFIGURED: "The payout account is not configured.",
  AMOUNT_BELOW_MINIMUM: "The amount is below the minimum allowed.",
  PENDING_PAYOUT_EXISTS: "A payout request is already pending.",
  PAYOUT_NOT_FOUND: "Payout not found.",
  PAYOUT_CREATION_FAILED: "Failed to create the payout. Please try again.",
  CURRENCY_MISMATCH: "Currency mismatch.",
  PAYOUT_NOT_PENDING: "This payout is not pending.",
  BOOKING_NOT_FOUND: "Booking not found.",
  SLOT_NOT_AVAILABLE: "This time slot is no longer available.",
  SLOT_ALREADY_RESERVED: "This time slot is already reserved.",
  INVALID_DATE: "Invalid date.",
  REVIEW_ALREADY_EXISTS: "A review already exists.",
};

const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/** Extract a human-readable message from a {statusCode, code, message} error body. */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; code?: string }
      | undefined;

    // Known backend code → friendly mapped message (never the raw code)
    if (data?.code && CODE_PATTERN.test(data.code) && ERROR_MESSAGES[data.code]) {
      return ERROR_MESSAGES[data.code];
    }
    // Readable backend message (4xx only — never English-only 500 text)
    const status = error.response?.status ?? 0;
    if (status >= 400 && status < 500) {
      if (typeof data?.code === "string" && data.code && !CODE_PATTERN.test(data.code)) {
        return data.code;
      }
      if (data?.message) {
        return Array.isArray(data.message) ? data.message.join(", ") : data.message;
      }
    }
  }
  return fallback;
}

export default client;
