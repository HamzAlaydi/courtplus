import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useGetProfile, usePayMatch } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useStripePayment } from "hooks";
import { ParticipantStatus } from "models";
import {
  ActivityStackNavigationProp,
  ActivityStackParamList,
} from "navigation/types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "store";
import { invalidateQuery } from "utils";

export const useBookingDetails = () => {
  const route = useRoute<RouteProp<ActivityStackParamList, "BookingDetails">>();
  const { item } = route.params;
  const { navigate } = useNavigation<ActivityStackNavigationProp>();
  const { mutateAsync: payMatchMutation } = usePayMatch();
  const { initPayment, showPaymentOverlay } = useStripePayment();
  const toggleLoading = useAppStore((store) => store.toggleLoading);
  const { t } = useTranslation();
  const { data: profileData } = useGetProfile();

  const handlePay = async () => {
    try {
      toggleLoading(true);
      const response = await payMatchMutation({
        id: item.id,
      });
      if (response) {
        await initPayment({
          ephemeralKey: response?.ephemeralKey ?? "",
          customerId: response?.customerId ?? "",
          publishableKey: response?.publishableKey ?? "",
          clientSecret: response?.clientSecret ?? "",
        });
        await showPaymentOverlay(item?.court?.mainAsset ?? "", false);
        invalidateQuery("getBookings");
      }
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onActivityLogPress = () => {
    navigate("ActivityLog", { id: item.id });
  };

  const onBookingTicketPress = () => {
    navigate("BookingTicket", { item });
  };

  const formattedStartTime = item.startDate.split("T")[1].slice(0, 5);
  const formattedEndTime = item.endDate.split("T")[1].slice(0, 5);

  const formattedTime = `${formattedStartTime} - ${formattedEndTime}`;

  const currentParticipant = useMemo(
    () =>
      item.participants.find(
        (participant) => participant.userId === profileData?.id
      ),
    [item.participants, profileData?.id]
  );

  const bookingTicketButton = useMemo(() => {
    if (currentParticipant?.status === ParticipantStatus.PENDING_PAYMENT) {
      return {
        title: t("booking.payPart"),
        onPress: handlePay,
      };
    }
    return {
      title: t("activity.bookingTicket"),
      onPress: onBookingTicketPress,
    };
  }, [t]);

  return {
    onActivityLogPress,
    item,
    formattedTime,
    bookingTicketButton,
  };
};
