import { StyleSheet } from "react-native";
import { ColorsType, Radius, Typography } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      minHeight: verticalScale(54),
      paddingHorizontal: spacing[24],
      paddingVertical: verticalScale(8),
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing[8],
    },
    large: {
      minHeight: verticalScale(54),
    },
    medium: {
      minHeight: verticalScale(48),
      paddingHorizontal: spacing[20],
    },
    small: {
      minHeight: verticalScale(40),
      paddingHorizontal: spacing[16],
    },
    label: {
      ...Typography.headline3.semiBold,
      textAlign: "center",
    },
    displayLabel: {
      ...Typography.displayButton.bold,
      textAlign: "center",
    },
    primary: {
      backgroundColor: colors.LIME,
      borderColor: colors.LIME,
    },
    primaryText: {
      color: colors.INK,
    },
    active: {
      backgroundColor: colors.LIME,
      borderColor: colors.LIME,
    },
    activeText: {
      color: colors.INK,
    },
    secondary: {
      backgroundColor: colors.INK,
      borderColor: colors.INK,
    },
    secondaryText: {
      color: colors.WHITE,
    },
    dark: {
      backgroundColor: colors.INK,
      borderColor: colors.INK,
    },
    darkText: {
      color: colors.WHITE,
    },
    outline: {
      backgroundColor: colors.CARD,
      borderColor: colors.LINE,
    },
    outlineText: {
      color: colors.INK,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    ghostText: {
      color: colors.INK,
    },
    danger: {
      backgroundColor: colors.DANGER_BG,
      borderColor: colors.DANGER_BG,
    },
    dangerText: {
      color: colors.DANGER,
    },
    bordered: {
      backgroundColor: "transparent",
      borderColor: colors.LINE,
    },
    borderedText: {
      color: colors.MUTED,
    },
    link: {
      backgroundColor: "transparent",
      minHeight: verticalScale(44),
      paddingHorizontal: spacing[8],
    },
    linkText: {
      color: colors.MUTED,
      textDecorationLine: "underline",
      textDecorationColor: colors.MUTED,
      ...Typography.headline3.medium,
    },
    disabled: {
      backgroundColor: "transparent",
      borderColor: colors.LINE,
    },
    disabledText: {
      color: colors.FAINT,
    },
    disabledDark: {
      backgroundColor: colors.LINE,
      borderColor: colors.LINE,
    },
    disabledDarkText: {
      color: colors.FAINT,
    },
  });
