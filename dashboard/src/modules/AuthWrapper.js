import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthWrapper = ({ children }) => {
  const { isAuthenticated, tokenExpiry } = useSelector((state) => state.auth);

  // Memoize authentication check
  const isTokenValid = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    return isAuthenticated && tokenExpiry > currentTime;
  }, [isAuthenticated, tokenExpiry]);

  if (!isTokenValid) {
    // Redirect to login if the token is invalid or user is not authenticated
    return <Navigate to="/auth/signin" replace />;
  }

  return children;
};

export default AuthWrapper;
