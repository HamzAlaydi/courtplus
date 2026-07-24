import { useThemeContext } from "contexts";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { fontSizes, getFontType, Typography } from "theme";
import styles from "./CustomCalendar.styles";
import { CalendarAvailabilityProps } from "./CustomCalendar.types";
import { formatDate, isRTL } from "utils";
import { useTranslation } from "react-i18next";
import { CustomText } from "atoms/index";
import { MarkedDates } from "react-native-calendars/src/types";

const CalendarAvailability = ({
  overrideContainerStyle,
  bookedDays,
  onMonthChange,
  isLoading,
  calendarBackgroundColor,
  onDayPress,
  showInfo = true,
  selectedDate = new Date(),
}: CalendarAvailabilityProps) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = styles(colors);

  const isArrowLeftDisabled = useMemo(() => {
    const date = new Date();
    return (
      currentDate.getFullYear() === date.getFullYear() &&
      currentDate.getMonth() <= new Date().getMonth()
    );
  }, [currentDate]);

  const onPressArrowRight = (onAddMonth: () => void) => {
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    setCurrentDate(nextMonthDate);
    onAddMonth();
    onMonthChange?.(nextMonthDate);
  };

  const onPressArrowLeft = (onSubtractMonth: () => void) => {
    const prevMonthDate = new Date(currentDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    setCurrentDate(prevMonthDate);
    onSubtractMonth();
    onMonthChange?.(prevMonthDate);
  };

  const onHandleDayPress = (day: DateData) => {
    setCurrentDate(new Date(day.dateString));
    onDayPress?.(day);
  };

  const bookedMarkedDates = bookedDays?.reduce((acc, day) => {
    return {
      ...acc,
      [`${currentDate.getFullYear()}-${
        currentDate.getMonth() + 1 < 10 ? "0" : ""
      }${currentDate.getMonth() + 1}-${day < 10 ? "0" : ""}${day}`]: {
        selected: true,
        selectedColor: "transparent",
        selectedTextColor: colors.MED_GREY_3,
        disabled: true,
      },
    };
  }, {});

  const markedDates: MarkedDates = useMemo(() => {
    return {
      ...bookedMarkedDates,
      [currentDate.toISOString().split("T")[0]]: {
        selected: true,
        selectedColor: colors.GREEN_YELLOWISH,
      },
    };
  }, [currentDate, bookedMarkedDates, colors]);

  return (
    <View style={overrideContainerStyle}>
      <Calendar
        disableAllTouchEventsForInactiveDays
        disableAllTouchEventsForDisabledDays
        initialDate={new Date().toDateString()}
        style={overrideContainerStyle}
        disableArrowLeft={isArrowLeftDisabled}
        minDate={new Date().toDateString()}
        markedDates={markedDates}
        displayLoadingIndicator={isLoading}
        onDayPress={onHandleDayPress}
        date={currentDate.toDateString()}
        renderHeader={(date) => {
          return (
            <CustomText
              font="bottomSheetTitle"
              weight="bold"
              overrideStyle={themedStyles.month}
              text={formatDate(date?.toString() ?? "", "MMMM yyyy")}
            />
          );
        }}
        onPressArrowLeft={onPressArrowLeft}
        onPressArrowRight={onPressArrowRight}
        theme={{
          calendarBackground: calendarBackgroundColor ?? colors.LIGHT_GREY,
          dayTextColor: colors.SLATE_GRAY,
          textDayStyle: {
            ...Typography.chip.medium,
          },
          arrowColor: colors.BLACK,
          todayBackgroundColor: colors.GREEN_YELLOWISH,
          todayTextColor: colors.SLATE_GRAY,
          textDayFontWeight: "600",
          textSectionTitleColor: colors.SLATE_GRAY,
          textDayHeaderFontSize: isRTL ? fontSizes[10] : fontSizes[12],
          selectedDayBackgroundColor: colors.BLACK,
          selectedDayTextColor: colors.BLACK,
          textDayHeaderFontFamily: getFontType("regular"),
          textMonthFontFamily: getFontType("bold"),
          textMonthFontSize: fontSizes[18],
          textMonthFontWeight: "700",
        }}
      />
      {showInfo && (
        <View style={themedStyles.availabilityContainer}>
          <CustomText
            font="chip"
            weight="medium"
            text={t("general.fullyBooked")}
            overrideStyle={themedStyles.infoText}
          />
          <View style={themedStyles.bookedRowContainer}>
            <View style={themedStyles.bookedDot} />
            <View style={themedStyles.availableDot} />
          </View>
          <CustomText
            font="chip"
            weight="medium"
            text={t("general.available")}
            overrideStyle={themedStyles.infoText}
          />
        </View>
      )}
    </View>
  );
};

export default CalendarAvailability;
