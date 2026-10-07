import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const GuestWrapper = ({ children }) => {
  const { isAuthenticated, tokenExpiry, refreshToken } = useSelector(
    (state) => state.auth
  );

  // Memoized authentication check. Same rule as AuthWrapper on purpose: a
  // stored refresh token still counts as a live session, and if the two
  // guards disagreed the user would be redirected in a loop between /auth
  // and the app.
  const isTokenValid = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    return isAuthenticated && (tokenExpiry > currentTime || !!refreshToken);
  }, [isAuthenticated, tokenExpiry, refreshToken]);

  if (isTokenValid) {
    // Redirect authenticated users to home if they try to access auth routes
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestWrapper;
