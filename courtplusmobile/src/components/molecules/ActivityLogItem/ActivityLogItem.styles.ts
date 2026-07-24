import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
    },
    timestamp: {
      color: colors.GRAYISH_BLUE,
    },

    court: {
      color: colors.MED_GREEN,
    },
    imageContainer: {
      width: spacing[32],
      height: spacing[32],
      borderRadius: spacing[50],
      backgroundColor: colors.BLACK,
    },
    description: {
      width: horizontalScale(289),
    },
  });
