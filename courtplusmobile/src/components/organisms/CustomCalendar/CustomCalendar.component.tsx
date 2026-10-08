import { useThemeContext } from "contexts";
import { addMonths, startOfMonth, subMonths } from "date-fns";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { fontSizes, getFontType, Typography } from "theme";
import styles from "./CustomCalendar.styles";
import { CalendarAvailabilityProps } from "./CustomCalendar.types";
import { formatDate, isRTL, moderateScale } from "utils";
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
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const isArrowLeftDisabled = useMemo(() => {
    const date = new Date();
    return (
      currentDate.getFullYear() === date.getFullYear() &&
      currentDate.getMonth() <= new Date().getMonth()
    );
  }, [currentDate]);

  const onPressArrowRight = (onAddMonth: () => void) => {
    // setMonth(+1) on the 31st skips a month; anchor on the 1st instead.
    const nextMonthDate = addMonths(startOfMonth(currentDate), 1);
    setCurrentDate(nextMonthDate);
    onAddMonth();
    onMonthChange?.(nextMonthDate);
  };

  const onPressArrowLeft = (onSubtractMonth: () => void) => {
    const prevMonthDate = subMonths(startOfMonth(currentDate), 1);
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
        selectedTextColor: colors.FAINT,
        disabled: true,
      },
    };
  }, {});

  const markedDates: MarkedDates = useMemo(() => {
    return {
      ...bookedMarkedDates,
      [currentDate.toISOString().split("T")[0]]: {
        selected: true,
        selectedColor: colors.INK,
        selectedTextColor: colors.WHITE,
      },
    };
  }, [currentDate, bookedMarkedDates, colors]);

  return (
    <View style={overrideContainerStyle}>
      <Calendar
        disableAllTouchEventsForInactiveDays
        disableAllTouchEventsForDisabledDays
        initialDate={new Date().toDateString()}
        style={themedStyles.calendar}
        disableArrowLeft={isArrowLeftDisabled}
        minDate={new Date().toDateString()}
        markedDates={markedDates}
        displayLoadingIndicator={isLoading}
        onDayPress={onHandleDayPress}
        date={currentDate.toDateString()}
        renderHeader={(date) => {
          return (
            <View style={themedStyles.header}>
              <CustomText
                font="sectionTitle"
                weight="bold"
                overrideStyle={themedStyles.month}
                text={formatDate(date?.toString() ?? "", "MMMM yyyy")}
              />
            </View>
          );
        }}
        onPressArrowLeft={onPressArrowLeft}
        onPressArrowRight={onPressArrowRight}
        theme={{
          calendarBackground: calendarBackgroundColor ?? colors.CARD,
          dayTextColor: colors.INK,
          textDayStyle: {
            ...Typography.headline3.medium,
            lineHeight: moderateScale(20),
          },
          textDisabledColor: colors.FAINT,
          textInactiveColor: colors.FAINT,
          arrowColor: colors.INK,
          disabledArrowColor: colors.FAINT,
          arrowStyle: themedStyles.arrow,
          todayBackgroundColor: colors.LIME_TINT,
          todayTextColor: colors.LIME_TINT_TEXT,
          textSectionTitleColor: colors.MUTED,
          textDayHeaderFontSize: isRTL ? fontSizes[10] : moderateScale(11),
          textDayHeaderFontFamily: getFontType("semiBold"),
          selectedDayBackgroundColor: colors.INK,
          selectedDayTextColor: colors.WHITE,
          textMonthFontFamily: getFontType("bold"),
          textMonthFontSize: fontSizes[18],
        }}
      />
      {showInfo && (
        <View style={themedStyles.availabilityContainer}>
          <View style={themedStyles.legendItem}>
            <View style={themedStyles.bookedDot} />
            <CustomText
              font="caption"
              weight="medium"
              text={t("general.fullyBooked")}
              overrideStyle={themedStyles.infoText}
            />
          </View>
          <View style={themedStyles.legendItem}>
            <View style={themedStyles.availableDot} />
            <CustomText
              font="caption"
              weight="medium"
              text={t("general.available")}
              overrideStyle={themedStyles.infoText}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default CalendarAvailability;
