import axios from "axios";
import { store } from "../context/index"; // Import Redux store
import { setAuthData, logout } from "../context/auth"; // Import Redux actions
import { getTokens, setTokens, clearTokens } from "./auth-utils";
import { API_URL_COMMON } from "./http.common";
import authService from "./auth.service";
import { jwtDecode } from "jwt-decode";

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: API_URL_COMMON,
});

// ✅ Global API request function
export const apiRequest = async ({
  method,
  url,
  data,
  params,
  customHeaders,
}) => {
  try {
    let response = null;
    if (customHeaders) {
      response = await axiosInstance({
        method,
        url,
        data,
        params,
        headers: customHeaders,
      });
    } else {
      response = await axiosInstance({
        method,
        url,
        data,
        params,
      });
    }

    return response.data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// ✅ Flag to prevent multiple refresh attempts at the same time
let isRefreshing = false;
let refreshSubscribers = [];

// ✅ Function to refresh token and update Redux + localStorage
const refreshAuthToken = async () => {
  console.log("========>refreshing");
  const dispatch = store.dispatch;
  const { refreshToken } = getTokens();

  if (!refreshToken) {
    console.warn("No refresh token found, logging out...");
    dispatch(logout());
    clearTokens();
    return null;
  }

  if (isRefreshing) {
    // ✅ If a refresh is already in progress, return a promise that resolves when it completes
    return new Promise((resolve) => {
      refreshSubscribers.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    const data = await authService.refreshTokenStaff();

    if (!data?.accessToken || !data?.refreshToken) {
      console.error("Invalid refresh token response, logging out...");
      dispatch(logout());
      clearTokens();
      return null;
    }

    const newDecodedToken = jwtDecode(data.accessToken);

    // ✅ Store new tokens in LocalStorage
    setTokens(data.accessToken, data.refreshToken);

    // ✅ Update Redux store
    dispatch(
      setAuthData({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: JSON.parse(localStorage.getItem("userData")),
        role: newDecodedToken.type || "unknown",
        isAuthenticated: true,
        tokenExpiry: newDecodedToken.exp,
      })
    );

    console.log("Token refreshed successfully.");

    // ✅ Resolve all queued requests with the new token
    refreshSubscribers.forEach((callback) => callback(data.accessToken));
    refreshSubscribers = [];

    return data.accessToken;
  } catch (err) {
    console.error("Token refresh failed:", err);
    dispatch(logout());
    clearTokens();
    return null;
  } finally {
    isRefreshing = false;
  }
};

// 🔹 Request Interceptor (Attach Access Token & Refresh If Needed)
axiosInstance.interceptors.request.use(
  async (config) => {
    if (config.url.startsWith("/auth")) {
      return config;
    }

    let { accessToken, tokenExpiry } = getTokens();
    const currentTime = Math.floor(Date.now() / 1000);

    if (tokenExpiry && tokenExpiry - currentTime < 60) {
      accessToken = await refreshAuthToken();
      console.log("refreshing");

      if (!accessToken) return Promise.reject("Token refresh failed.");
      // The header was built from the OLD token; without this the first
      // request after a refresh always failed with 401.
      config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Response Interceptor (Handle 401 Unauthorized Errors)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ✅ Skip retrying token refresh on authentication routes
    if (window.location.pathname.startsWith("/auth")) {
      console.warn("Skipping token refresh on auth routes.");
      return Promise.reject(error);
    }

    // if (error.response?.status === 401 && !originalRequest._retry) {
    //   originalRequest._retry = true;

    //   try {
    //     let newAccessToken = await refreshAuthToken();
    //     console.log("refreshing");

    //     if (!newAccessToken) {
    //       console.error("No new token, logging out.");
    //       return Promise.reject(error);
    //     }

    //     // ✅ Update headers using authHeader() and retry request
    //     originalRequest.headers = authHeader();
    //     return axiosInstance(originalRequest);
    //   } catch (refreshError) {
    //     console.error("Refresh token failed on 401 response:", refreshError);
    //     return Promise.reject(refreshError);
    //   }
    // }

    return Promise.reject(error);
  }
);

export default axiosInstance;
