import { StyleSheet } from "react-native";
import { ColorsType, Typography } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      minHeight: verticalScale(56),
      paddingHorizontal: spacing[20],
      paddingVertical: verticalScale(16),
      borderRadius: spacing[12],
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing[8],
    },
    disabled: {
      backgroundColor: undefined,
      borderWidth: 1,
      borderColor: colors.SLATE_GRAY,
    },
    disabledText: {
      color: colors.SLATE_GRAY,
    },
    active: {
      backgroundColor: colors.GREEN_YELLOWISH,
    },
    activeText: {
      color: colors.BUTTON_GREEN,
      ...Typography.headline3.bold,
    },
    bordered: {
      borderWidth: 1,
      borderColor: colors.GREY,
    },
    borderedText: {
      color: colors.GREY,
    },
    link: {
      backgroundColor: undefined,
    },
    linkText: {
      color: colors.SLATE_GRAY,
      textDecorationLine: "underline",
      textDecorationColor: colors.SLATE_GRAY,
      ...Typography.headline3.medium,
    },
    dark: {
      backgroundColor: colors.BACKGROUND,
    },
    darkText: {
      color: colors.GREEN_YELLOWISH,
    },
    disabledDark: {
      backgroundColor: colors.MED_GREY_3,
    },
    disabledDarkText: {
      color: colors.BLACK,
    },
  });
