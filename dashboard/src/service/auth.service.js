import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance"; // ✅ Use axiosInstance
const API_URL = "/auth/staff"; // No need to include API_URL_COMMON (handled in axiosInstance)

class AuthService {
  // Revokes the server session (denylisted immediately) — before, logout
  // was client-only and the session stayed valid for 30 days.
  logoutStaff() {
    return apiRequest({
      method: "post",
      url: `${API_URL}/logout`,
      customHeaders: authHeader(),
    });
  }

  signInStaff(userData) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/login`,
      data: userData,
    });
  }

  refreshTokenStaff() {
    const refreshToken = localStorage.getItem("refreshToken");
    return apiRequest({
      method: "post",
      url: `${API_URL}/refresh-token`,
      customHeaders: { Authorization: `Bearer ${refreshToken}` },
    });
  }

  signUpStaff(userData) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/signup`,
      data: userData,
    });
  }

  verifyStaff(userData) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/verify-code`,
      data: userData,
    });
  }

  resendVerificationCode(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/resend-verification-code`,
      data: data,
    });
  }

  // For a vendor who mistyped their address at signup: an unverified account
  // is never issued a token, so this is the only way they can correct it.
  changeUnverifiedEmail(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/change-unverified-email`,
      data: data,
    });
  }

  forgetPass(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/forgot-password`,
      data: data,
    });
  }

  resetPass(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/reset-password`,
      data: data,
    });
  }
}

const authService = new AuthService();

export default authService;
