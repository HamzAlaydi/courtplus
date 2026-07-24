import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const RoleWrapper = ({ requiredRole, children }) => {
  const { role, isAuthenticated, tokenExpiry } = useSelector(
    (state) => state.auth
  );

  // Memoize authentication and role check
  const isAuthorized = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    return (
      isAuthenticated && tokenExpiry > currentTime && role === requiredRole
    );
  }, [isAuthenticated, tokenExpiry, role, requiredRole]);

  if (!isAuthorized) {
    return (
      <Navigate
        to={isAuthenticated ? "/unauthorized" : "/auth/signin"}
        replace
      />
    );
  }

  return children;
};

export default RoleWrapper;
