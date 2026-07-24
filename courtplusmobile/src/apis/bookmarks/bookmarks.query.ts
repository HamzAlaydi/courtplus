import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { getNextPage, queryKeys } from "utils";
import {
  deleteBookmark,
  getBookmarks,
  postBookmark,
} from "./bookmarks.service";

export const useGetBookmarks = () => {
  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [queryKeys.getMyBookmarks],
      initialData: { pageParams: [], pages: [] },
      queryFn: ({ pageParam = 1 }) =>
        getBookmarks({ page: pageParam, type: ["court", "branch"] }),
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

export const usePostBookmark = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: postBookmark,
  });
  return { mutateAsync, isPending };
};

export const useDeleteBookmark = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: deleteBookmark,
  });
  return { mutateAsync, isPending };
};
