import { t } from "i18next";
import { NotificationMapperProps } from "./NotificationItem.types";

export const notificationMapper = ({
  onAccept,
  onFollow,
}: NotificationMapperProps) => {
  return {
    ["booking_invitation"]: {
      title: t("notifications.accept"),
      onPress: onAccept,
    },
    ["follow"]: {
      title: t("notifications.followBack"),
      onPress: onFollow,
    },
  };
};
