import { StackActions, useNavigation } from "@react-navigation/native";
import { useCreateBooking } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useStripePayment } from "hooks";
import { PaymentType } from "models";
import { useState } from "react";
import { useAppStore, useUserStore } from "store";
import {
  formatDate,
  formatTimeRange,
  getSlotsDurationMinutes,
  sortSlotsByStartTime,
} from "utils";

export const useBookingSummary = () => {
  const [isPaymentSelected, setIsPaymentSelected] = useState(PaymentType.SPLIT);
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

  const totalAmountSplitted = (
    totalAmount /
    ((participants?.length ?? 1) + 1)
  ).toFixed(0);

  const formattedTime = formatTimeRange(bookingData?.timeSummary?.slots ?? []);

  const isSplitPaymentSelected = isPaymentSelected === PaymentType.SPLIT;
  const isWholePaymentSelected = isPaymentSelected === PaymentType.WHOLE;

  const onPaymentTypeChange = (type: PaymentType) => {
    setIsPaymentSelected(type);
  };

  const onCreateBooking = async () => {
    try {
      toggleLoading(true);
      const response = await createBookingMutation({
        courtId: courtData?.id ?? "",
        startAt: `${formatDate(
          timeSummary?.date?.toString() ?? "",
          "yyyy-MM-dd"
        )} ${sortedSlots[0]?.startTime ?? ""}`,
        duration: durationMinutes,
        participants: participants?.map((participant) => participant.id) ?? [],
        paymentType: isPaymentSelected,
      });

      if (response) {
        await initPayment({
          ephemeralKey: response?.ephemeralKey ?? "",
          customerId: response?.customerId ?? "",
          publishableKey: response?.publishableKey ?? "",
          clientSecret: response?.clientSecret ?? "",
        });
        await showPaymentOverlay(courtData?.mainAsset ?? "");
      }
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
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
