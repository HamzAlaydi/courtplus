import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { notificationMapper } from "./NotificationItem.utils";
import { Notification } from "models";
import { useAppStore } from "store";
import { useFollow, useRespondMatch } from "apis";
import { invalidateQuery } from "utils";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";

export const useNotificationItem = ({ item }: { item: Notification }) => {
  const { t } = useTranslation();
  const { toggleLoading } = useAppStore((store) => store);
  const { mutateAsync: respondMatchMutation } = useRespondMatch();
  const { mutateAsync: followMutation } = useFollow();

  const handleMatchAccept = async () => {
    try {
      toggleLoading(true);
      await respondMatchMutation({
        id: item.data.bookingId ?? "",
        accept: true,
        participantId: item.userId ?? "",
      });
      invalidateQuery("getNotifications");
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      toggleLoading(true);
      await followMutation({ id: item.userId ?? "" });
      invalidateQuery("getNotifications");
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const notificationButton: { title: string; onPress: () => void } =
    useMemo(() => {
      return notificationMapper({
        onAccept: handleMatchAccept,
        onFollow: handleFollow,
      })[item.type as keyof typeof notificationMapper];
    }, []);

  return {
    notificationButton,
  };
};
