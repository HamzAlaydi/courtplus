import { axiosInstance } from "apis";
import { ApiResponse, enableNotificationPermission, endPoints } from "utils";
import {
  NotificationRequest,
  NotificationResponse,
  NotificationSettingsResponse,
  UpdateNotificationSettingsRequest,
} from "./notification.types";
import { getUniqueId } from "react-native-device-info";
import {
  getMessaging,
  onTokenRefresh,
} from "@react-native-firebase/messaging";

export const getNotificationSettings = async () => {
  const deviceId = await getUniqueId();
  const response = await axiosInstance.get<NotificationSettingsResponse>(
    endPoints.notificationSettings,
    {
      headers: {
        "X-Device-Id": deviceId,
      },
    }
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const updateNotificationSettings = async (
  data: UpdateNotificationSettingsRequest
) => {
  const deviceId = await getUniqueId();
  const response = await axiosInstance.patch<ApiResponse>(
    endPoints.notificationSettings,
    data,
    {
      headers: {
        "X-Device-Id": deviceId,
      },
    }
  );
  if (response.data.OK) {
    return true;
  }
  return false;
};

export const getNotifications = async ({
  page,
  pageSize = 10,
}: NotificationRequest) => {
  const response = await axiosInstance.get<NotificationResponse>(
    endPoints.notifications,
    {
      params: {
        page,
        pageSize,
      },
    }
  );
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const saveNotificationToken = async (token: string) => {
  const response = await axiosInstance.post<ApiResponse>(endPoints.saveToken, {
    token,
  });
  return response.data.OK;
};

// Dedupes uploads so the token is only sent when it actually changes.
let lastUploadedToken: string | null = null;

const uploadToken = async (token: string) => {
  if (!token || token === lastUploadedToken) return;
  const saved = await saveNotificationToken(token);
  if (saved) {
    lastUploadedToken = token;
  }
};

/**
 * Requests the notification permission, fetches the FCM token and uploads it
 * to the backend. Safe to call after login/signup and on every app start —
 * failures are swallowed so they never block the auth flow.
 */
export const registerNotificationToken = async () => {
  try {
    await enableNotificationPermission();
    const token = await getMessaging().getToken();
    await uploadToken(token);
  } catch {
    // Push registration is best-effort only.
  }
};

/** Re-uploads the FCM token whenever Firebase rotates it. */
export const subscribeToNotificationTokenRefresh = () => {
  return onTokenRefresh(getMessaging(), (token) => {
    uploadToken(token).catch(() => {});
  });
};

export const markNotificationAsRead = async (id: string) => {
  const response = await axiosInstance.patch<ApiResponse>(
    `${endPoints.notifications}/${id}/read`
  );
  return response.data.OK;
};

export const markAllNotificationsAsSeen = async () => {
  const response = await axiosInstance.post<ApiResponse>(
    `${endPoints.notifications}/mark-seen`
  );
  return response.data.OK;
};
