import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const GuestWrapper = ({ children }) => {
  const { isAuthenticated, tokenExpiry } = useSelector((state) => state.auth);

  // Memoized authentication check
  const isTokenValid = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    return isAuthenticated && tokenExpiry > currentTime;
  }, [isAuthenticated, tokenExpiry]);

  if (isTokenValid) {
    // Redirect authenticated users to home if they try to access auth routes
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestWrapper;
