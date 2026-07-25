import React from "react";
import { useTranslation } from "react-i18next";
import { ReviewCourtModal } from "molecules/index";
import { useRateBookingPrompt } from "./RateBookingPrompt.logic";

/**
 * One-time post-game rate prompt shown on app open when the user has a
 * completed booking without a review.
 */
const RateBookingPrompt = () => {
  const { promptBooking, modalRef, onDismissPrompt } = useRateBookingPrompt();
  const { t } = useTranslation();

  if (!promptBooking) {
    return null;
  }

  const courtName = promptBooking.court?.name ?? "";

  return (
    <ReviewCourtModal
      ref={modalRef}
      courtName={courtName}
      bookingId={promptBooking.id}
      onClose={onDismissPrompt}
      onLater={onDismissPrompt}
      title={t("reviews.ratePromptTitle", { court: courtName })}
    />
  );
};

export default RateBookingPrompt;
