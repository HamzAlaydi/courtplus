import { useGetNotifications, useMarkAllNotificationsAsSeen } from "apis";
import { useEffect } from "react";
import { flattenData } from "utils";

export const useNotifications = () => {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetNotifications();
  const { mutateAsync: markAllAsSeenMutation } = useMarkAllNotificationsAsSeen();

  // Clear the unseen badge when the screen is opened.
  useEffect(() => {
    markAllAsSeenMutation().catch(() => {});
  }, [markAllAsSeenMutation]);

  const notificationsData = flattenData(data);
  return {
    notificationsData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
