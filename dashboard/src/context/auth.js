import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  refreshToken: null,
  user: null,
  role: null,
  isAuthenticated: false,
  tokenExpiry: null,
};

// Helper function to initialize auth from localStorage
const loadAuthFromStorage = () => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const userData = localStorage.getItem("userData");
  const tokenExpiry = localStorage.getItem("tokenExpiry");
  const role = localStorage.getItem("role");

  if (accessToken && refreshToken && userData && tokenExpiry) {
    const currentTime = Math.floor(Date.now() / 1000);

    if (parseInt(tokenExpiry) > currentTime) {
      return {
        token: accessToken,
        refreshToken,
        user: JSON.parse(userData),
        role,
        isAuthenticated: true,
        tokenExpiry: parseInt(tokenExpiry),
      };
    }
  }

  return initialState;
};

// Load authentication state when app starts
const persistedAuthState = loadAuthFromStorage();
const authSlice = createSlice({
  name: "auth",
  initialState: persistedAuthState,
  reducers: {
    login(state, action) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.tokenExpiry = action.payload.tokenExpiry;

      // Store auth data in localStorage
      localStorage.setItem("accessToken", action.payload.token);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
      localStorage.setItem("userData", JSON.stringify(action.payload.user));
      localStorage.setItem("role", action.payload.role);
      localStorage.setItem("tokenExpiry", action.payload.tokenExpiry);
    },
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.tokenExpiry = null;

      // Clear localStorage on logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("role");
      localStorage.removeItem("tokenExpiry");
    },
    setAuthData(state, action) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.tokenExpiry = action.payload.tokenExpiry;

      // Update localStorage
      localStorage.setItem("accessToken", action.payload.token);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
      localStorage.setItem("userData", JSON.stringify(action.payload.user));
      localStorage.setItem("role", action.payload.role);
      localStorage.setItem("tokenExpiry", action.payload.tokenExpiry);
    },
  },
});

export const { login, logout, setAuthData } = authSlice.actions;
export default authSlice.reducer;
