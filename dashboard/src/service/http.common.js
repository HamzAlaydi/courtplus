// API base URL. Set REACT_APP_API_URL at build time (Vercel env) for deployed
// environments; falls back to the local backend for development.
export const API_URL_COMMON =
  process.env.REACT_APP_API_URL || "http://localhost:3000";
