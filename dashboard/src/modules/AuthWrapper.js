import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthWrapper = ({ children }) => {
  const { isAuthenticated, tokenExpiry, refreshToken } = useSelector(
    (state) => state.auth
  );

  // Memoize authentication check. An expired ACCESS token is not a logged-out
  // session: the 30-day refresh token is still stored and the axios layer
  // swaps it for a new access token on the next request (and dispatches
  // logout when that fails). Requiring an unexpired access token here forced
  // a fresh login after every 15-minute break. GuestWrapper must use the
  // exact same rule, or the two guards bounce the user back and forth.
  const isTokenValid = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    return isAuthenticated && (tokenExpiry > currentTime || !!refreshToken);
  }, [isAuthenticated, tokenExpiry, refreshToken]);

  if (!isTokenValid) {
    // Redirect to login if the token is invalid or user is not authenticated
    return <Navigate to="/auth/signin" replace />;
  }

  return children;
};

export default AuthWrapper;
