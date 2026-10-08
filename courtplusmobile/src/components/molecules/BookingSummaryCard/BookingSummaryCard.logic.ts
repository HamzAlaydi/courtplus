import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useEnterMatch } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { differenceInMinutes } from "date-fns";
import { Booking, Sport } from "models";
import { useMemo, useRef } from "react";
import { useAppStore } from "store";
import { getBookingStatusPill, invalidateQuery, mapSportItem } from "utils";

export const useBookingSummaryCard = ({
  item,
  profileId,
}: {
  item: Booking;
  profileId: string;
}) => {
  const reviewCourtModalRef = useRef<BottomSheetModal>(null);
  const { mutateAsync: enterMatchMutation } = useEnterMatch();
  const courtSport: Sport = useMemo(
    () => ({
      id: "",
      name: item.court.sport || "",
      level: "",
      userId: "",
      timePreference: "",
    }),
    [item.court.sport]
  );
  const sport = mapSportItem(courtSport);
  const participants = item.participants.filter(
    (participant) => participant.userId !== profileId
  );

  const currentParticipant = item.participants.find(
    (participant) => participant.userId === profileId
  );
  const toggleLoading = useAppStore((store) => store.toggleLoading);
  const court = item.court;

  const isLessThan10Minutes =
    Math.abs(differenceInMinutes(new Date(item.startDate), new Date())) <= 10;

  // The shared viewer-aware pill, so the list card, the booking details and
  // the ticket always agree for the same viewer. Display only.
  const statusPill = getBookingStatusPill(item, {
    participant: currentParticipant,
  });

  const onEnterMatch = async () => {
    try {
      toggleLoading(true);
      await enterMatchMutation({ id: item.id });
      invalidateQuery("getBookings");
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onShowReviewCourtModal = () => {
    reviewCourtModalRef.current?.present();
  };

  const onDismissReviewCourtModal = () => {
    reviewCourtModalRef.current?.dismiss();
  };

  return {
    enterMatchMutation,
    isLessThan10Minutes,
    sport,
    participants,
    court,
    onEnterMatch,
    onShowReviewCourtModal,
    onDismissReviewCourtModal,
    reviewCourtModalRef,
    currentParticipant,
    statusPill,
  };
};
