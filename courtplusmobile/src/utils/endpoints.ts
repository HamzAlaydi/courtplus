import { Platform } from "react-native";

// In dev builds, hit the local backend: 10.0.2.2 is the host machine from the
// Android emulator; use your LAN IP instead when testing on a physical device.
const devBaseUrl = Platform.select({
  android: "http://10.0.2.2:3000/",
  default: "http://localhost:3000/",
});

export const endPoints = {
  baseUrl: __DEV__ ? devBaseUrl : "https://api-dev.courtplusapp.com/",
  login: "auth/customers/login/phone",
  sendCode: "auth/customers/send-code",
  signup: "auth/customers/signup/phone",
  checkUsername: "auth/customers/check-username",
  profile: "users/me",
  refreshToken: "auth/customers/refresh-token",
  socialLogin: "auth/customers/login/social",
  sports: "users/me/sports",
  courts: "courts",
  upload: "assets/upload",
  branches: "branches",
  bookmarks: "bookmarks",
  logout: "auth/customers/logout",
  friendships: "friendships",
  bookings: "bookings",
  notifications: "notifications",
  notificationSettings: "users/me/preferences",
  saveToken: "notifications/token",
  users: "users",
  updatePhone: "users/me/phone/code",
  verifyPhone: "users/me/phone/verify",
  follow: "follow",
  reviews: "reviews",
  posts: "posts",
  signedUrl: "assets/signed-url",
  createReport: "report",
  openBookings: "bookings/open",
  unfollow: "unfollow",
};
