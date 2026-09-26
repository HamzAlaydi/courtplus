import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { getNextPage, queryKeys } from "utils";
import {
  createBooking,
  enterMatch,
  getBookings,
  getMatchEvents,
  getOpenBookings,
  joinMatch,
  payMatch,
  respondJoinRequest,
  respondMatch,
  cancelMatch,
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
  const {
    data,
    isFetching,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
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
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
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
  const {
    data,
    isFetching,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
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
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  };
};

export const useGetMatchEvents = ({ id }: EventsRequest) => {
  const {
    data,
    isFetching,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [queryKeys.getBookingEvents, id],
    initialData: { pageParams: [], pages: [] },
    queryFn: ({ pageParam = 1 }) => getMatchEvents({ id, page: pageParam }),
    initialPageParam: 1,
    // Ask for the next page only when the server says one exists. The old
    // "a page of 10 means there is more" guess kept re-requesting page 1 of
    // this single-page endpoint, so a match with 10+ events grew an endless
    // list of duplicates as the user scrolled.
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage?.pagination?.currentPage;
      const totalPages = lastPage?.pagination?.totalPages;
      if (!currentPage || !totalPages || currentPage >= totalPages) {
        return undefined;
      }
      return currentPage + 1;
    },
  });

  const isLoading = isFetching && !isFetchingNextPage;
  const eventsData = data?.pages.flatMap((page) => page?.items ?? []) ?? [];

  return {
    eventsData,
    isLoading,
    isRefetching,
    refetch,
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

export const useRespondJoinRequest = () => {
  const { mutateAsync } = useMutation({
    mutationFn: respondJoinRequest,
  });
  return {
    mutateAsync,
  };
};

export const useJoinMatch = () => {
  const { mutateAsync } = useMutation({
    mutationFn: joinMatch,
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

export const useCancelMatch = () => {
  const { mutateAsync } = useMutation({
    mutationFn: cancelMatch,
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
