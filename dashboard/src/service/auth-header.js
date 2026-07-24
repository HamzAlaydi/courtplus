export default function authHeader(contentType, newHeaders = {}) {
  const accessToken = localStorage.getItem("accessToken");

  // Default headers
  const headers = {
    "Content-Type": contentType || "application/json", // Default to JSON if no contentType provided
  };

  // Add Authorization header if access_token exists
  if (accessToken) {
    headers.Authorization = "Bearer " + accessToken;
  }

  // Merge with new headers
  return { ...headers, ...newHeaders };
}
