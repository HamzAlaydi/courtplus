import { useQuery } from "@tanstack/react-query";
import { getBookings } from "apis";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "store";
import { queryKeys } from "utils";

/**
 * Finds the most recent completed booking the user hasn't reviewed (and
 * hasn't already been prompted about) so it can be rated on app open.
 */
export const useRateBookingPrompt = () => {
  const dismissedIds = useAppStore((state) => state.dismissedRatePromptIds);
  const addDismissedId = useAppStore((state) => state.addDismissedRatePromptId);
  const modalRef = useRef<BottomSheetModal>(null);

  const { data: completedBookings } = useQuery({
    queryKey: [queryKeys.getUnratedCompletedBookings],
    queryFn: () => getBookings({ page: 1, pageSize: 5, status: "completed" }),
  });

  const promptBooking = useMemo(
    () =>
      completedBookings?.find(
        (booking) => !booking.review && !dismissedIds.includes(booking.id)
      ),
    [completedBookings, dismissedIds]
  );

  useEffect(() => {
    if (promptBooking) {
      modalRef.current?.present();
    }
  }, [promptBooking]);

  // Shown at most once per booking: submitting the review or tapping
  // "Later" both dismiss the prompt for good.
  const onDismissPrompt = () => {
    if (promptBooking) {
      addDismissedId(promptBooking.id);
    }
    modalRef.current?.dismiss();
  };

  return {
    promptBooking,
    modalRef,
    onDismissPrompt,
  };
};
