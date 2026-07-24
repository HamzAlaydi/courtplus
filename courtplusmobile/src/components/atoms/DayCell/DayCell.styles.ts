import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    dayContainer: {
      borderWidth: 1,
      borderColor: colors.LIGHT_BLUE,
      alignItems: "center",
      paddingVertical: verticalScale(11),
      paddingHorizontal: horizontalScale(19),
      borderRadius: spacing[12],
      gap: verticalScale(8),
    },
    selectedDay: {
      backgroundColor: colors.GREEN_YELLOWISH,
      borderWidth: 0,
    },
    disabledDay: {
      color: colors.GREY,
    },
    dayText: {
      color: colors.BLACK,
    },
  });
