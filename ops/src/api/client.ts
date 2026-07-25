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
      if (!token) return Promise.reject(new Error("Token refresh failed"));
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

/** Extract a human-readable message from a {statusCode, code, message} error body. */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; code?: string }
      | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(", ") : data.message;
    }
    if (data?.code) return data.code.replace(/_/g, " ").toLowerCase();
  }
  return fallback;
}

export default client;
