import { RouteProp, useRoute } from "@react-navigation/native";
import { useCreateBooking } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useStripePayment } from "hooks";
import { PaymentType } from "models";
import { AuthenticatedStackParamList } from "navigation/types";
import { useAppStore, useOpenMatchStore } from "store";
import { formatDate } from "utils";

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

  const duration = 30 * (selectedSlots?.length ?? 0);

  const totalAmount =
    (court?.hourlyRate ?? 0) * (30 * (selectedSlots?.length ?? 0));

  const totalParticipants = participants?.length ? participants?.length + 1 : 1;

  const totalAmountSplitted = totalAmount / totalParticipants;

  const onCreateBooking = async () => {
    try {
      toggleLoading(true);
      const response = await createBookingMutation({
        courtId: court?.id ?? "",
        duration,
        participants: participants?.map((participant) => participant.id) ?? [],
        paymentType: PaymentType.SPLIT,
        startAt: `${formatDate(date?.toString() ?? "", "yyyy-MM-dd")} ${
          selectedSlots?.[0].startTime
        }`,
        playersASide: Number(gameType) ?? 0,
        open: true,
        level: level?.key ?? "",
        gender,
        autoAccept,
      });
      if (response) {
        await initPayment({
          ephemeralKey: response?.ephemeralKey ?? "",
          customerId: response?.customerId ?? "",
          publishableKey: response?.publishableKey ?? "",
          clientSecret: response?.clientSecret ?? "",
        });
        await showPaymentOverlay(court?.mainAsset ?? "");
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
