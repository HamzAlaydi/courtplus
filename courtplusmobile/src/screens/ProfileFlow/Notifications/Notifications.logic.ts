import {
  NotificationSettings,
  UpdateNotificationSettingsRequest,
  useGetNotificationSettings,
  useUpdateNotificationSettings,
} from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const useNotificationsSettings = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useGetNotificationSettings();
  const {
    mutateAsync: updateNotificationSettingsMutation,
    isLoading: isUpdating,
    isError: isUpdatingError,
    error: updatingError,
  } = useUpdateNotificationSettings();

  const notifications = data?.notifications;

  const onValueChange = async (value: keyof NotificationSettings) => {
    const { OK, ...restData } = data!!;
    try {
      await updateNotificationSettingsMutation({
        ...restData,
        notifications: {
          ...notifications!!,
          [value]: !notifications?.[value] as boolean,
        },
      });
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    }
  };

  const notificationSettings = useMemo(
    () => [
      {
        icon: "likeSettings",
        title: t("settings.likes"),
        value: "likes",
      },
      {
        icon: "follow",
        title: t("settings.newFollowers"),
        value: "followers",
      },
      {
        icon: "layers",
        title: t("settings.matchActivity"),
        value: "bookingActivity",
      },
      {
        icon: "layers",
        title: t("settings.openMatch"),
        value: "openBookings",
      },
      {
        icon: "nearby",
        title: t("settings.nearbyCourts"),
        value: "nearbyCourts",
      },
      {
        icon: "refresh",
        title: t("settings.updatesMore"),
        value: "updates",
      },
    ],
    [t]
  );

  return {
    notifications,
    isLoading,
    isError,
    error,
    updateNotificationSettingsMutation,
    isUpdating,
    isUpdatingError,
    updatingError,
    onValueChange,
    notificationSettings,
  };
};
