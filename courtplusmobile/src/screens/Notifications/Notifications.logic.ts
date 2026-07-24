import { useGetNotifications } from "apis";
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
