import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { notificationMapper } from "./NotificationItem.utils";
import { Notification } from "models";
import { useAppStore } from "store";
import { useFollow, useMarkNotificationAsRead, useRespondMatch } from "apis";
import { invalidateQuery, navigateToNotification } from "utils";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";

export const useNotificationItem = ({ item }: { item: Notification }) => {
  const { t } = useTranslation();
  const { toggleLoading } = useAppStore((store) => store);
  const { mutateAsync: respondMatchMutation } = useRespondMatch();
  const { mutateAsync: followMutation } = useFollow();
  const { mutateAsync: markAsReadMutation } = useMarkNotificationAsRead();

  const handleMatchAccept = useCallback(async () => {
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
  }, [item, respondMatchMutation, toggleLoading]);

  const handleFollow = useCallback(async () => {
    try {
      toggleLoading(true);
      await followMutation({ id: item.userId ?? "" });
      invalidateQuery("getNotifications");
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  }, [item, followMutation, toggleLoading]);

  const onNotificationPress = useCallback(() => {
    markAsReadMutation(item.id).catch(() => {});
    navigateToNotification({ kind: item.type, ...item.data });
  }, [item, markAsReadMutation]);

  const notificationButton: { title: string; onPress: () => void } =
    useMemo(() => {
      return notificationMapper({
        onAccept: handleMatchAccept,
        onFollow: handleFollow,
      })[item.type as keyof typeof notificationMapper];
    }, [item.type, handleMatchAccept, handleFollow]);

  return {
    notificationButton,
    onNotificationPress,
  };
};
