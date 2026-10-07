import { StackActions, useNavigation } from "@react-navigation/native";
import { useCreateBooking } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useStripePayment } from "hooks";
import { PaymentType } from "models";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore, useUserStore } from "store";
import {
  SPLIT_PAYMENT_ENABLED,
  getErrorText,
  formatDate,
  formatTimeRange,
  getSlotsDurationMinutes,
  sortSlotsByStartTime,
} from "utils";

export const useBookingSummary = () => {
  const { t } = useTranslation();
  // With the split hidden, the organiser always pays the whole booking —
  // starting on SPLIT would silently create a half-paid booking nobody can
  // top up from the UI.
  const [isPaymentSelected, setIsPaymentSelected] = useState(
    SPLIT_PAYMENT_ENABLED ? PaymentType.SPLIT : PaymentType.WHOLE
  );
  const bookingData = useUserStore((store) => store.bookingData);
  const { mutateAsync: createBookingMutation } = useCreateBooking();
  const toggleLoading = useAppStore((store) => store.toggleLoading);
  const { dispatch } = useNavigation();
  const clearBooking = useUserStore((store) => store.clearBooking);
  const { initPayment, showPaymentOverlay } = useStripePayment();

  const courtData = bookingData?.court;
  const timeSummary = bookingData?.timeSummary;
  const participants = bookingData?.participants;

  const sortedSlots = sortSlotsByStartTime(timeSummary?.slots ?? []);
  const durationMinutes = getSlotsDurationMinutes(sortedSlots);
  // Matches the backend: court.hourlyRate * (duration / 60)
  const totalAmount = (courtData?.hourlyRate ?? 0) * (durationMinutes / 60);

  // De-duplicated up front so the displayed share and the list actually sent
  // to the API are derived from the same seat count.
  const uniqueParticipantIds = Array.from(
    new Set((participants ?? []).map((participant) => participant.id))
  );

  const totalAmountSplitted = (
    totalAmount /
    (uniqueParticipantIds.length + 1)
  ).toFixed(0);

  const formattedTime = formatTimeRange(bookingData?.timeSummary?.slots ?? []);

  const isSplitPaymentSelected = isPaymentSelected === PaymentType.SPLIT;
  const isWholePaymentSelected = isPaymentSelected === PaymentType.WHOLE;

  const onPaymentTypeChange = (type: PaymentType) => {
    if (!SPLIT_PAYMENT_ENABLED && type === PaymentType.SPLIT) {
      return;
    }
    setIsPaymentSelected(type);
  };

  const onCreateBooking = async () => {
    let failure: string | null = null;
    try {
      toggleLoading(true);
      const response = await createBookingMutation({
        courtId: courtData?.id ?? "",
        startAt: `${formatDate(
          timeSummary?.date?.toString() ?? "",
          "yyyy-MM-dd"
        )} ${sortedSlots[0]?.startTime ?? ""}`,
        duration: durationMinutes,
        // The API rejects the whole booking when the same friend appears
        // twice, which the picker allowed. That 400 landed AFTER the user had
        // committed to paying, and the screen simply sat there.
        participants: uniqueParticipantIds,
        paymentType: isPaymentSelected,
      });

      if (!response) {
        // A falsy response means the request failed without throwing; without
        // this the screen went quiet and the user tapped Pay again and again.
        failure = t("messages.somethingWentWrong");
      } else {
        const paymentInitialized = await initPayment({
          ephemeralKey: response?.ephemeralKey ?? "",
          customerId: response?.customerId ?? "",
          publishableKey: response?.publishableKey ?? "",
          clientSecret: response?.clientSecret ?? "",
        });
        if (paymentInitialized) {
          await showPaymentOverlay(courtData?.mainAsset ?? "");
        }
      }
    } catch (error) {
      failure = getErrorText(error);
    } finally {
      toggleLoading(false);
      // Shown after the loader is torn down: a snackbar raised underneath the
      // full-screen loading overlay is invisible for its whole 3s life.
      if (failure) {
        showSnackbar({ message: failure });
      }
    }
  };

  const onCancelPress = () => {
    clearBooking();
    dispatch(StackActions.popToTop());
  };

  const finalAmount = isSplitPaymentSelected
    ? totalAmountSplitted
    : totalAmount;

  return {
    isSplitPaymentEnabled: SPLIT_PAYMENT_ENABLED,
    courtData,
    timeSummary,
    participants,
    totalAmount,
    setIsPaymentSelected,
    formattedTime,
    totalAmountSplitted,
    isSplitPaymentSelected,
    isWholePaymentSelected,
    onPaymentTypeChange,
    finalAmount,
    onCreateBooking,
    onCancelPress,
  };
};
