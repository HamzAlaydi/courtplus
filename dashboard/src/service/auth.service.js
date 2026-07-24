import { apiRequest } from "./axiosInstance"; // ✅ Use axiosInstance
const API_URL = "/auth/staff"; // No need to include API_URL_COMMON (handled in axiosInstance)

class AuthService {
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
