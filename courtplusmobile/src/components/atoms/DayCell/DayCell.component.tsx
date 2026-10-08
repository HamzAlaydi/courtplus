import React, { useMemo } from "react";
import { DayCellProps } from "./DayCell.types";
import { useThemeContext } from "contexts";
import styles from "./DayCell.styles";
import { currentDate, formatDate } from "utils";
import { isBefore } from "date-fns";
import CustomText from "atoms/CustomText/CustomText.component";
import PressableScale from "atoms/PressableScale/PressableScale.component";

const DayCell = ({
  day,
  isSelected,
  onPress,
  overrideContainerStyle,
}: DayCellProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const isDayDisabled = isBefore(day, currentDate);
  const isActive = isSelected;
  const isMuted = isDayDisabled && !isSelected;

  return (
    <PressableScale
      style={[
        themedStyles.dayContainer,
        isMuted && themedStyles.disabledContainer,
        isActive && themedStyles.selectedDay,
        overrideContainerStyle,
      ]}
      onPress={onPress}
      disabled={isDayDisabled}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive, disabled: isDayDisabled }}
    >
      <CustomText
        text={formatDate(day.toString(), "EEE")}
        font="overline"
        weight="semiBold"
        numberOfLines={1}
        overrideStyle={[
          themedStyles.dayName,
          isActive && themedStyles.selectedDayName,
          isMuted && themedStyles.disabledText,
        ]}
      />
      <CustomText
        text={formatDate(day.toString(), "d")}
        font="dayNumber"
        weight="bold"
        overrideStyle={[
          themedStyles.dayNumber,
          isActive && themedStyles.selectedDayNumber,
          isMuted && themedStyles.disabledText,
        ]}
      />
    </PressableScale>
  );
};

export default DayCell;
