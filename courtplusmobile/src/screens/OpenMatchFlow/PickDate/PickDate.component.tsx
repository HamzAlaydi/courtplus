import { useThemeContext } from "contexts";
import { Header } from "molecules/index";
import { CustomCalendar, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import Animated from "react-native-reanimated";
import { enterRise } from "utils";
import styles from "./PickDate.styles";
import { useTranslation } from "react-i18next";

import { usePickDate } from "./PickDate.logic";

const PickDateScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
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
    <MainWrapper>
      <Header whiteColor title={t("openMatch.pickDate")} />

      <Animated.View entering={enterRise(0)} style={themedStyles.calendarCard}>
        <CustomCalendar
          isLoading={isLoading}
          calendarBackgroundColor={colors.CARD}
          onDayPress={onDayPress}
          selectedDate={selectedDate}
          showInfo={false}
          bookedDays={unavailableDays}
          onMonthChange={onMonthChange}
        />
      </Animated.View>
    </MainWrapper>
  );
};

export default PickDateScreen;
