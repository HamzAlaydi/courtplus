import { CustomCalendar } from "organisms/index";
import React from "react";
import { useCourtAvailability } from "./CourtAvailability.logic";
import { CourtAvailabilityProps } from "./CourtAvailability.types";
import styles from "./CourtAvailability.styles";

const CourtAvailability = ({ courtId }: CourtAvailabilityProps) => {
  const { unavailableDays, isLoading, onMonthChange } =
    useCourtAvailability(courtId);

  return (
    <CustomCalendar
      bookedDays={unavailableDays}
      isLoading={isLoading}
      onMonthChange={onMonthChange}
      showInfo
      overrideContainerStyle={styles.container}
    />
  );
};

export default CourtAvailability;
