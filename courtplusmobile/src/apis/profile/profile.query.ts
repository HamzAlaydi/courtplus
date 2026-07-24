import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { getNextPage, queryKeys } from "utils";
import {
  addSport,
  deleteAccount,
  deleteSport,
  editProfile,
  getFriendships,
  getPosts,
  getProfile,
  logout,
  updatePhone,
  uploadImage,
  verifyPhone,
} from "./profile.service";
import { GetPostsRequest } from "./profile.types";
import { GetFriendshipsRequest } from "./profile.types";

export const useGetProfile = () => {
  const { data, isFetching, refetch } = useQuery({
    queryKey: [queryKeys.getProfile],
    queryFn: getProfile,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
  return { data, isFetching, refetch };
};

export const useGetPosts = (request: GetPostsRequest) => {
  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [queryKeys.getPosts, request],
      initialData: { pageParams: [], pages: [] },
      queryFn: ({ pageParam = 1 }) => getPosts({ ...request, page: pageParam }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, pages) => {
        return lastPage ? getNextPage(lastPage, pages) : undefined;
      },
      enabled: !!request.userId,
    });

  return {
    data,
    isLoading: isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};

export const useUpdatePhone = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: updatePhone,
  });
  return { mutateAsync, isPending };
};

export const useVerifyUserPhone = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: verifyPhone,
  });
  return { mutateAsync, isPending };
};

export const useLogout = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: logout,
  });
  return { mutateAsync, isPending };
};

export const useGetFriendships = (request: GetFriendshipsRequest) => {
  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [queryKeys.getFriendships, request],
    initialData: { pageParams: [], pages: [] },
    queryFn: ({ pageParam = 1 }) =>
      getFriendships({ ...request, page: pageParam }),
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
    refetch,
  };
};

export const useUploadImage = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: uploadImage,
  });
  return { mutateAsync, isPending };
};

export const useEditProfile = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: editProfile,
  });
  return { mutateAsync, isPending };
};

export const useDeleteSport = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: deleteSport,
  });
  return { mutateAsync, isPending };
};

export const useAddSport = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: addSport,
  });
  return { mutateAsync, isPending };
};

export const useDeleteAccount = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: deleteAccount,
  });
  return { mutateAsync, isPending };
};
