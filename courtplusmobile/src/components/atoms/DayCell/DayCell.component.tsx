import React from "react";
import { TouchableOpacity } from "react-native";
import { DayCellProps } from "./DayCell.types";
import { useThemeContext } from "contexts";
import styles from "./DayCell.styles";
import { currentDate, formatDate } from "utils";
import { isBefore } from "date-fns";
import CustomText from "atoms/CustomText/CustomText.component";

const DayCell = ({
  day,
  isSelected,
  onPress,
  overrideContainerStyle,
}: DayCellProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = styles(colors);

  const isDayDisabled = isBefore(day, currentDate);

  return (
    <TouchableOpacity
      style={[
        themedStyles.dayContainer,
        isSelected && themedStyles.selectedDay,
        overrideContainerStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isDayDisabled}
    >
      <CustomText
        text={formatDate(day.toString(), "d")}
        font="bottomSheetTitle"
        weight="bold"
        overrideStyle={
          isDayDisabled ? themedStyles.disabledDay : themedStyles.dayText
        }
      />
      <CustomText
        text={formatDate(day.toString(), "EEE")}
        font="chip"
        weight="regular"
        overrideStyle={
          isDayDisabled ? themedStyles.disabledDay : themedStyles.dayText
        }
      />
    </TouchableOpacity>
  );
};

export default DayCell;
