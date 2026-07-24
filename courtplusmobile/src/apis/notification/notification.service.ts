import { axiosInstance } from "apis";
import { ApiResponse, endPoints } from "utils";
import {
  NotificationRequest,
  NotificationResponse,
  NotificationSettingsResponse,
  UpdateNotificationSettingsRequest,
} from "./notification.types";
import { getUniqueId } from "react-native-device-info";

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
