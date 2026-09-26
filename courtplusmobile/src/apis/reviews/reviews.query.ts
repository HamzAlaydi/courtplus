import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { getReviews, postReview } from "./reviews.service";
import { flattenData, getNextPage, queryKeys } from "utils";
import { ReviewsRequest } from "./reviews.types";
import { Review } from "models";

export const usePostReview = () => {
  const { mutateAsync } = useMutation({
    mutationFn: postReview,
  });
  return { mutateAsync };
};

export const useGetReviews = ({ courtId }: ReviewsRequest) => {
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [queryKeys.getCourtReviews, courtId],
    queryFn: ({ pageParam = 1 }) =>
      getReviews({ page: pageParam, pageSize: 10, courtId }),
    initialPageParam: 1,
    initialData: { pageParams: [], pages: [] },
    getNextPageParam: (lastPage, pages) => {
      return lastPage ? getNextPage(lastPage, pages) : undefined;
    },
  });
  const reviews = flattenData<Review>(data);
  return {
    reviews,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  };
};
