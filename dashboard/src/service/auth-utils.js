import { jwtDecode } from "jwt-decode";

export const getTokens = () => {
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    tokenExpiry: localStorage.getItem("tokenExpiry"),
  };
};

export const setTokens = (accessToken, refreshToken) => {
  const tokenExpiry = jwtDecode(accessToken);

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("tokenExpiry", tokenExpiry.exp);
};

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenExpiry");
  localStorage.removeItem("userData");
  localStorage.removeItem("role");
};
