import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { GetUserByIdRequest, GetUsersRequest } from "./users.types";
import { getNextPage, queryKeys } from "utils";
import { follow, getUserById, getUsers, unfollow } from "./users.services";

export const useGetUsers = (request: GetUsersRequest) => {
  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [queryKeys.getUsers, request.search],
    initialData: { pageParams: [], pages: [] },
    queryFn: ({ pageParam = 1 }) => getUsers({ ...request, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      return lastPage ? getNextPage(lastPage, pages) : undefined;
    },
    enabled: !!request.search,
  });

  return {
    data,
    isLoading: isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  };
};

export const useFollow = () => {
  const { mutateAsync } = useMutation({
    mutationFn: follow,
  });
  return { mutateAsync };
};

export const useGetUserById = (
  request: GetUserByIdRequest,
  options: { enabled?: boolean } = {}
) => {
  const { data, isFetching, isLoading, refetch } = useQuery({
    queryKey: [queryKeys.getUserById, request.id],
    queryFn: () => getUserById(request),
    enabled: options.enabled ?? !!request.id,
  });
  return { data, isFetching, isLoading, refetch };
};

export const useUnfollow = () => {
  const { mutateAsync } = useMutation({
    mutationFn: unfollow,
  });
  return { mutateAsync };
};
