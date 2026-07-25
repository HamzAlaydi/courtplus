import { useNavigation } from "@react-navigation/native";
import { useGetBookings, useGetProfile } from "apis";
import { Booking } from "models";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { flattenData } from "utils";

export const useBookingHistory = () => {
  const { data: profileData } = useGetProfile();
  const {
    data,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetBookings({ page: 1, status: "completed" });
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();

  const bookingsData = flattenData(data);

  const onBookingDetailsPress = (booking: Booking) => {
    navigate("ActivityStack", {
      screen: "BookingDetails",
      params: { item: booking },
    });
  };

  return {
    bookingsData,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    onBookingDetailsPress,
    profileData,
  };
};
