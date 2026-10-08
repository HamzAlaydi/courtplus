import { useThemeContext } from "contexts";
import { CustomCalendar } from "organisms/index";
import React, { useMemo } from "react";
import { useCourtAvailability } from "./CourtAvailability.logic";
import { CourtAvailabilityProps } from "./CourtAvailability.types";
import styles from "./CourtAvailability.styles";

const CourtAvailability = ({ courtId }: CourtAvailabilityProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { unavailableDays, isLoading, onMonthChange } =
    useCourtAvailability(courtId);

  return (
    <CustomCalendar
      bookedDays={unavailableDays}
      isLoading={isLoading}
      onMonthChange={onMonthChange}
      showInfo
      calendarBackgroundColor={colors.CARD}
      overrideContainerStyle={themedStyles.container}
    />
  );
};

export default CourtAvailability;
