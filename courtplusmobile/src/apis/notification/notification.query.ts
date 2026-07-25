import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { getNextPage, invalidateQuery, onMutate, queryClient, queryKeys } from "utils";
import {
  getNotifications,
  getNotificationSettings,
  markAllNotificationsAsSeen,
  markNotificationAsRead,
  updateNotificationSettings,
} from "./notification.service";
import { UpdateNotificationSettingsRequest } from "./notification.types";

export const useGetNotificationSettings = () => {
  const { data, isFetching, isError, error } = useQuery({
    queryKey: [queryKeys.getNotificationsSettings],
    queryFn: getNotificationSettings,
  });
  return { data, isLoading: isFetching, isError, error };
};

export const useUpdateNotificationSettings = () => {
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: updateNotificationSettings,
    onMutate: async (newData) => {
      return onMutate<UpdateNotificationSettingsRequest>(
        "getNotificationsSettings",
        newData
      );
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        [queryKeys.getNotificationsSettings],
        context?.previousData
      );
    },
  });
  return { mutateAsync, isLoading: isPending, isError, error };
};

export const useGetNotifications = () => {
  const {
    data,
    isFetching,
    isRefetching,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [queryKeys.getNotifications],
    initialData: { pageParams: [], pages: [] },
    queryFn: ({ pageParam = 1 }) => getNotifications({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      return lastPage ? getNextPage(lastPage, pages) : undefined;
    },
  });
  return {
    data,
    isLoading: isFetching,
    isRefetching,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  };
};

export const useMarkNotificationAsRead = () => {
  const { mutateAsync } = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => invalidateQuery("getNotifications"),
  });
  return { mutateAsync };
};

export const useMarkAllNotificationsAsSeen = () => {
  const { mutateAsync } = useMutation({
    mutationFn: markAllNotificationsAsSeen,
    onSuccess: () => invalidateQuery("getNotifications"),
  });
  return { mutateAsync };
};
