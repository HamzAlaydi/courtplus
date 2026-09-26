import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useCancelMatch, useGetProfile, usePayMatch } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useStripePayment } from "hooks";
import { MatchStatus, ParticipantStatus } from "models";
import {
  ActivityStackNavigationProp,
  ActivityStackParamList,
} from "navigation/types";
import { useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useAppStore } from "store";
import { invalidateQuery, formatInZone } from "utils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

export const useBookingDetails = () => {
  const route = useRoute<RouteProp<ActivityStackParamList, "BookingDetails">>();
  const { item } = route.params;
  const { navigate, goBack } = useNavigation<ActivityStackNavigationProp>();
  const { mutateAsync: payMatchMutation } = usePayMatch();
  const { mutateAsync: cancelMatchMutation } = useCancelMatch();
  const { initPayment, showPaymentOverlay } = useStripePayment();
  const toggleLoading = useAppStore((store) => store.toggleLoading);
  const { t } = useTranslation();
  const { data: profileData } = useGetProfile();
  const reviewCourtModalRef = useRef<BottomSheetModal>(null);
  const [hasJustPaid, setHasJustPaid] = useState(false);

  const handlePay = async () => {
    try {
      toggleLoading(true);
      const response = await payMatchMutation({
        id: item.id,
      });
      if (response) {
        const paymentInitialized = await initPayment({
          ephemeralKey: response?.ephemeralKey ?? "",
          customerId: response?.customerId ?? "",
          publishableKey: response?.publishableKey ?? "",
          clientSecret: response?.clientSecret ?? "",
        });
        if (paymentInitialized) {
          const paid = await showPaymentOverlay(
            item?.court?.mainAsset ?? "",
            false
          );
          // This screen renders from a route-param snapshot and never
          // refetches, so without this the button still said "Pay your part"
          // after a successful payment and a second tap charged the card
          // again. The API now refuses that too.
          if (paid) {
            setHasJustPaid(true);
          }
        }
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

  const zone = item.timeZone;
  const formattedStartTime = formatInZone(item.startDate, "HH:mm", zone);
  const formattedEndTime = formatInZone(item.endDate, "HH:mm", zone);

  const formattedTime = `${formattedStartTime} - ${formattedEndTime}`;

  const currentParticipant = useMemo(
    () =>
      item.participants.find(
        (participant) => participant.userId === profileData?.id
      ),
    [item.participants, profileData?.id]
  );

  // Creator cancels the whole booking (every paid seat is refunded); any
  // other participant leaves the match. Only for bookings that have not
  // started — the API refuses later cancellations as well.
  const isCreator =
    (currentParticipant as { isCreator?: boolean } | undefined)?.isCreator ??
    item.userId === profileData?.id;
  // Policy (mirrors the API): free cancellation up to 12 hours before the
  // start; after that the seat is kept and the button disappears.
  const CANCELLATION_CUTOFF_MS = 12 * 60 * 60 * 1000;
  const isUpcoming =
    item.status !== MatchStatus.CANCELLED &&
    item.status !== MatchStatus.COMPLETED &&
    new Date(item.startDate).getTime() > Date.now();
  const canCancel =
    isUpcoming &&
    new Date(item.startDate).getTime() - Date.now() > CANCELLATION_CUTOFF_MS;
  const cancellationClosed = isUpcoming && !canCancel;

  const cancelAction = useMemo(() => {
    if (!canCancel) return null;
    const confirm = async () => {
      try {
        toggleLoading(true);
        await cancelMatchMutation({ id: item.id });
        invalidateQuery("getBookings");
        showSnackbar({
          message: isCreator ? t("activity.cancelled") : t("activity.left"),
        });
        goBack();
      } catch (error) {
        showSnackbar({ message: (error as Error).message });
      } finally {
        toggleLoading(false);
      }
    };
    return {
      title: isCreator ? t("activity.cancelBooking") : t("activity.leaveMatch"),
      onPress: () =>
        Alert.alert(
          isCreator
            ? t("activity.cancelConfirmTitle")
            : t("activity.leaveConfirmTitle"),
          isCreator
            ? t("activity.cancelConfirmMessage")
            : t("activity.leaveConfirmMessage"),
          [
            { text: t("general.keep"), style: "cancel" },
            { text: t("general.confirm"), style: "destructive", onPress: confirm },
          ]
        ),
    };
  }, [canCancel, isCreator, item.id, t]);

  const bookingTicketButton = useMemo(() => {
    if (item.status === MatchStatus.COMPLETED && !item.review) {
      return {
        title: t("activity.addReview"),
        onPress: () => reviewCourtModalRef.current?.present(),
      };
    }
    if (
      !hasJustPaid &&
      currentParticipant?.status === ParticipantStatus.PENDING_PAYMENT
    ) {
      return {
        title: t("booking.payPart"),
        onPress: handlePay,
      };
    }
    return {
      title: t("activity.bookingTicket"),
      onPress: onBookingTicketPress,
    };
  }, [t, item.status, item.review, currentParticipant, hasJustPaid]);

  return {
    onActivityLogPress,
    item,
    formattedTime,
    bookingTicketButton,
    cancelAction,
    cancellationClosed,
    reviewCourtModalRef,
  };
};
