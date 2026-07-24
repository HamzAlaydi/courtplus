import {
  axiosInstance,
  NotificationResponse,
  NotificationSettingsResponse,
} from "apis";
import { ApiResponse, endPoints } from "utils";

export const getNotifications = async () => {
  const response = await axiosInstance.get<NotificationResponse>(
    endPoints.notifications
  );
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const getNotificationSettings = async () => {
  const response = await axiosInstance.get<NotificationSettingsResponse>(
    endPoints.notificationSettings
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const updateNotificationSettings = async (
  data: NotificationSettingsResponse
) => {
  const response = await axiosInstance.patch<ApiResponse>(
    endPoints.notificationSettings,
    data
  );
  if (response.data.OK) {
    return true;
  }
  return false;
};
