import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    dayContainer: {
      flex: 1,
      height: verticalScale(64),
      alignItems: "center",
      justifyContent: "center",
      gap: verticalScale(2),
      borderRadius: Radius.input,
      backgroundColor: colors.CARD,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    selectedDay: {
      backgroundColor: colors.INK,
      borderColor: colors.INK,
    },
    disabledContainer: {
      backgroundColor: colors.GROUND,
      borderColor: colors.GROUND,
    },
    dayName: {
      color: colors.MUTED,
    },
    selectedDayName: {
      color: colors.LIME,
    },
    dayNumber: {
      color: colors.INK,
    },
    selectedDayNumber: {
      color: colors.WHITE,
    },
    disabledText: {
      color: colors.FAINT,
    },
  });
