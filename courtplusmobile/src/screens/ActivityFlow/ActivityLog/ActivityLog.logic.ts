import { RouteProp, useRoute } from "@react-navigation/native";
import { useGetMatchEvents } from "apis";
import { ActivityStackParamList } from "navigation/types";

export const useActivityLog = () => {
  const { params } =
    useRoute<RouteProp<ActivityStackParamList, "ActivityLog">>();
  const { id } = params;
  const {
    eventsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetMatchEvents({ id: id });
  return {
    eventsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
