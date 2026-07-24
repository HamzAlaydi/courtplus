import { StyleSheet } from "react-native";
import { Typography, ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType, isDark: boolean) =>
  StyleSheet.create({
    container: {
      borderRadius: spacing[8],
      backgroundColor: colors.LIGHT_GREY,
      height: verticalScale(56),
      width: horizontalScale(47.83),
    },
    focusedContainer: {
      backgroundColor: isDark ? colors.WHITE : colors.DARK_GREEN,
      borderWidth: 1,
      borderColor: isDark ? colors.MED_GREY : colors.DARK_GREEN,
    },
    pinCodeText: {
      color: colors.GREEN_YELLOWISH,
      ...Typography.headline1.semiBold,
    },
  });
