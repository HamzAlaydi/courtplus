import { setAuthData } from "../context/auth";
import { jwtDecode } from "jwt-decode";
import authService from "../service/auth.service";

export const signInStaff = (credentials) => async (dispatch) => {
  try {
    const data = await authService.signInStaff(credentials).catch((err) => err);
    // Handle API error response properly
    if (data.response && data.response.data) {
      const errorMessage = data.response.data.message || "INVALID_CREDENTIALS";
      return errorMessage;
    }

    // Check if verification is required
    if (data.requiresVerification) {
      window.location.href = `/auth/verification?email=${encodeURIComponent(
        credentials.email
      )}`;
      return;
    }

    const { accessToken, refreshToken, user } = data;

    // Decode the access token to get expiration and role
    const decodedToken = jwtDecode(accessToken);
    const { exp, type: role } = decodedToken;

    // Store tokens and user data
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("tokenExpiry", exp); // Store token expiration timestamp
    localStorage.setItem("userData", JSON.stringify(user));
    localStorage.setItem("role", role);

    // Update Redux store
    dispatch(
      setAuthData({
        token: accessToken,
        refreshToken,
        user,
        role,
        isAuthenticated: true,
        tokenExpiry: exp,
      })
    );
  } catch (error) {
    console.error("Login failed:", error);

    // Handle API error response properly
    if (error.response && error.response.data) {
      const errorMessage = error.response.data.message || "INVALID_CREDENTIALS";
      return new Error(errorMessage);
    }
  }
};

export const signUpStaff = async (userData) => {
  return await authService.signUpStaff(userData);
};

export const verifyStaff = async (userData) => {
  return await authService.verifyStaff(userData);
};

export const forgetPass = async (data) => {
  return await authService.forgetPass(data);
};

export const resetPass = async (data) => {
  return await authService.resetPass(data);
};
