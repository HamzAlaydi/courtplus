import { useNavigation } from "@react-navigation/native";
import { useGetOpenBookings, useGetProfile, usePayMatch } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useStripePayment } from "hooks";
import { Booking } from "models";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useAppStore } from "store";
import { flattenData, invalidateQuery } from "utils";

export const useOpenMatch = () => {
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();
  const {
    data,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetOpenBookings({ page: 1 });
  const { data: profileData } = useGetProfile();
  const { mutateAsync: payMatchMutation } = usePayMatch();
  const { initPayment, showPaymentOverlay } = useStripePayment();
  const toggleLoading = useAppStore((store) => store.toggleLoading);

  const profileId = profileData?.id;

  const bookingsData = flattenData(data);
  const isFetching = isLoading && !isFetchingNextPage;

  const onStartMatchPress = () => {
    navigate("NewMatch");
  };

  const handlePay = async (booking: Booking) => {
    try {
      toggleLoading(true);
      const response = await payMatchMutation({
        id: booking.id,
      });
      if (response) {
        const paymentInitialized = await initPayment({
          ephemeralKey: response?.ephemeralKey ?? "",
          customerId: response?.customerId ?? "",
          publishableKey: response?.publishableKey ?? "",
          clientSecret: response?.clientSecret ?? "",
        });
        if (paymentInitialized) {
          await showPaymentOverlay(booking?.court?.mainAsset ?? "", false);
        }
        invalidateQuery("getOpenBookings");
      }
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  return {
    bookingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isRefetching,
    refetch,
    onStartMatchPress,
    profileId,
    handlePay,
  };
};
