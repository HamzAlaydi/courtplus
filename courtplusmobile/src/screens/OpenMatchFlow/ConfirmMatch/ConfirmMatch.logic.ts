import { RouteProp, useRoute } from "@react-navigation/native";
import { useCreateBooking } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useStripePayment } from "hooks";
import { PaymentType } from "models";
import { AuthenticatedStackParamList } from "navigation/types";
import { useAppStore, useOpenMatchStore } from "store";
import { formatDate, getSlotsDurationMinutes, sortSlotsByStartTime } from "utils";

export const useConfirmMatch = () => {
  const court = useOpenMatchStore((store) => store.court);
  const date = useOpenMatchStore((store) => store.date);
  const selectedSlots = useOpenMatchStore((store) => store.selectedSlots);
  const { mutateAsync: createBookingMutation } = useCreateBooking();
  const { initPayment, showPaymentOverlay } = useStripePayment();
  const toggleLoading = useAppStore((store) => store.toggleLoading);

  const { gameType, game, participants, autoAccept, level, gender } =
    useRoute<RouteProp<AuthenticatedStackParamList, "ConfirmMatch">>().params;

  const formattedDate = formatDate(date ?? "", "EEE dd MMM, hh:mm aaa");

  const sortedSlots = sortSlotsByStartTime(selectedSlots ?? []);
  const duration = getSlotsDurationMinutes(sortedSlots);

  // Matches the backend: court.hourlyRate * (duration / 60)
  const totalAmount = (court?.hourlyRate ?? 0) * (duration / 60);

  // An open match is shared by every seat on the court, not just the friends
  // invited up front (usually none). Dividing by `invited + 1` showed the
  // organiser the WHOLE court price as "your part", and the backend charged
  // exactly that before any joiner had paid.
  const seats = Math.max(2, (Number(gameType) || 1) * 2);

  const totalAmountSplitted =
    Math.round((totalAmount / seats + Number.EPSILON) * 100) / 100;

  const onCreateBooking = async () => {
    try {
      toggleLoading(true);
      const response = await createBookingMutation({
        courtId: court?.id ?? "",
        duration,
        participants: participants?.map((participant) => participant.id) ?? [],
        paymentType: PaymentType.SPLIT,
        startAt: `${formatDate(date?.toString() ?? "", "yyyy-MM-dd")} ${
          sortedSlots[0]?.startTime ?? ""
        }`,
        playersASide: Number(gameType) ?? 0,
        open: true,
        level: level?.key ?? "",
        gender,
        autoAccept,
      });
      if (response) {
        const paymentInitialized = await initPayment({
          ephemeralKey: response?.ephemeralKey ?? "",
          customerId: response?.customerId ?? "",
          publishableKey: response?.publishableKey ?? "",
          clientSecret: response?.clientSecret ?? "",
        });
        if (paymentInitialized) {
          await showPaymentOverlay(court?.mainAsset ?? "");
        }
      }
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  return {
    gameType,
    game,
    participants,
    autoAccept,
    court,
    formattedDate,
    level,
    duration,
    totalAmountSplitted,
    onCreateBooking,
  };
};
