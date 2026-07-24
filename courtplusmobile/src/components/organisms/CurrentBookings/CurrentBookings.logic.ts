import { useNavigation } from "@react-navigation/native";
import { useGetBookings, useGetProfile } from "apis";
import { Booking } from "models";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useCallback } from "react";
import { flattenData } from "utils";

export const useCurrentBookings = () => {
  const { data: profileData } = useGetProfile();
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetBookings({ page: 1, status: "pending,in_progress" });

  const bookingsData = flattenData(data);
  const isMyBooking = useCallback(
    (item: Booking) =>
      item.participants.find(
        (participant) =>
          participant.userId === profileData?.id && participant.isCreator
      ),
    [profileData]
  );

  const onBookingPress = (booking: Booking) => {
    navigate("ActivityStack", {
      screen: "BookingDetails",
      params: { item: booking },
    });
  };

  return {
    bookingsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isMyBooking,
    onBookingPress,
    profileData,
  };
};
