import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { getNextPage, onMutate, queryClient, queryKeys } from "utils";
import {
  getNotifications,
  getNotificationSettings,
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
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
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
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
