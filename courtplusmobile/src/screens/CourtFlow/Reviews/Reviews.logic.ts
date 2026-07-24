import { RouteProp, useRoute } from "@react-navigation/native";
import { useGetReviews } from "apis";
import { CourtStackParamList } from "navigation/types";

export const useReviews = () => {
  const route = useRoute<RouteProp<CourtStackParamList, "Reviews">>();
  const { courtId } = route.params;
  const {
    reviews,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetReviews({ page: 1, courtId });
  return {
    reviews,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  };
};
