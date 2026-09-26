import { useNavigation } from "@react-navigation/native";
import {
  useGetOpenBookings,
  useGetProfile,
  useJoinMatch,
  usePayMatch,
} from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useStripePayment } from "hooks";
import { t } from "i18next";
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
  const { mutateAsync: joinMatchMutation } = useJoinMatch();
  const { initPayment, showPaymentOverlay } = useStripePayment();
  const toggleLoading = useAppStore((store) => store.toggleLoading);

  const profileId = profileData?.id;

  const bookingsData = flattenData(data);
  const isFetching = isLoading && !isFetchingNextPage;

  const onStartMatchPress = () => {
    navigate("NewMatch");
  };

  /**
   * "Book now" used to always POST /bookings/:id/pay, which only accepts a
   * caller who is already a participant — so for the strangers this list
   * exists for it always answered 404 and joining a match was impossible.
   * A stranger must JOIN; paying is only for a seat that is already held.
   */
  const handleBookNow = async (booking: Booking) => {
    const isParticipant = booking.participants?.some(
      (participant) => participant.userId === profileId
    );
    try {
      toggleLoading(true);
      const response = isParticipant
        ? await payMatchMutation({ id: booking.id })
        : await joinMatchMutation({ id: booking.id });

      // Only a split match bills the joiner straight away and answers with
      // the Stripe payload; on a whole-payment match the host already paid,
      // and a match that needs the host's approval has nothing to charge yet.
      if (response?.clientSecret) {
        const paymentInitialized = await initPayment({
          ephemeralKey: response?.ephemeralKey ?? "",
          customerId: response?.customerId ?? "",
          publishableKey: response?.publishableKey ?? "",
          clientSecret: response?.clientSecret ?? "",
        });
        if (paymentInitialized) {
          await showPaymentOverlay(booking?.court?.mainAsset ?? "", false);
        }
      } else if (!isParticipant) {
        // `autoAccept` is served by the API but is not part of the shared
        // Booking model yet; read it narrowly so the confirmation tells the
        // truth instead of promising a seat the host still has to approve.
        const { autoAccept } = booking as Booking & { autoAccept?: boolean };
        showSnackbar({
          message: autoAccept
            ? t("openMatch.joined")
            : t("openMatch.joinRequested"),
        });
      }
      invalidateQuery("getOpenBookings");
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
    handleBookNow,
  };
};
