import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.DARK_GREEN,
      paddingHorizontal: spacing[20],
      paddingVertical: verticalScale(12),
      borderRadius: spacing[12],
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[16],
    },
    title: {
      color: colors.WHITE,
    },
    selected: {
      backgroundColor: colors.GREEN_YELLOWISH,
    },
    selectedTitle: {
      color: colors.BACKGROUND,
    },
    image: {
      width: spacing[28],
      height: verticalScale(18.85),
    },
  });
