import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { flattenData, getNextPage, queryKeys } from "utils";
import {
  createBooking,
  enterMatch,
  getBookings,
  getMatchEvents,
  getOpenBookings,
  payMatch,
  respondMatch,
} from "./bookings.service";
import {
  BookingsRequest,
  EventsRequest,
  OpenBookingsRequest,
} from "./bookings.types";

export const useGetBookings = ({
  page,
  pageSize,
  ...request
}: BookingsRequest) => {
  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [queryKeys.getBookings],
      initialData: { pageParams: [], pages: [] },
      queryFn: ({ pageParam = 1 }) =>
        getBookings({ page: pageParam, ...request }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, pages) => {
        return lastPage ? getNextPage(lastPage, pages) : undefined;
      },
    });

  return {
    data,
    isLoading: isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};

export const useCreateBooking = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createBooking,
  });
  return {
    mutateAsync,
    isPending,
  };
};

export const useGetOpenBookings = ({
  page,
  ...request
}: OpenBookingsRequest) => {
  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [queryKeys.getOpenBookings, request],
      initialData: { pageParams: [], pages: [] },
      queryFn: ({ pageParam = 1 }) =>
        getOpenBookings({ page: pageParam, ...request }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, pages) => {
        return lastPage ? getNextPage(lastPage, pages) : undefined;
      },
    });
  const isLoading = isFetching && !isFetchingNextPage;
  return {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};

export const useGetMatchEvents = ({ id }: EventsRequest) => {
  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [queryKeys.getBookingEvents, id],
      initialData: { pageParams: [], pages: [] },
      queryFn: ({ pageParam = 1 }) => getMatchEvents({ id }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, pages) => {
        return lastPage ? getNextPage(lastPage, pages) : undefined;
      },
    });

  const isLoading = isFetching && !isFetchingNextPage;
  const eventsData = flattenData(data);

  return {
    eventsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};

export const useRespondMatch = () => {
  const { mutateAsync } = useMutation({
    mutationFn: respondMatch,
  });
  return {
    mutateAsync,
  };
};

export const usePayMatch = () => {
  const { mutateAsync } = useMutation({
    mutationFn: payMatch,
  });
  return {
    mutateAsync,
  };
};

export const useEnterMatch = () => {
  const { mutateAsync } = useMutation({
    mutationFn: enterMatch,
  });
  return {
    mutateAsync,
  };
};
