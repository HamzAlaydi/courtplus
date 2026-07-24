import { useThemeContext } from "contexts";
import { Header } from "molecules/index";
import { CustomCalendar, MainWrapper } from "organisms/index";
import React from "react";
import styles from "./PickDate.styles";
import { useTranslation } from "react-i18next";

import { usePickDate } from "./PickDate.logic";

const PickDateScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const { t } = useTranslation();
  const {
    onDayPress,
    date,
    unavailableDays,
    isLoading,
    onMonthChange,
    selectedDate,
  } = usePickDate();

  return (
    <MainWrapper whiteBackground>
      <Header whiteColor title={t("openMatch.pickDate")} />

      <CustomCalendar
        isLoading={isLoading}
        overrideContainerStyle={styles.calendar}
        calendarBackgroundColor={colors.WHITE}
        onDayPress={onDayPress}
        selectedDate={selectedDate}
        showInfo={false}
        bookedDays={unavailableDays}
        onMonthChange={onMonthChange}
      />
    </MainWrapper>
  );
};

export default PickDateScreen;
