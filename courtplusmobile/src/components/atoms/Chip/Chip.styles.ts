import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.CARD,
      borderWidth: 1,
      borderColor: colors.LINE,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
      minHeight: verticalScale(38),
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(3),
      borderRadius: Radius.pill,
    },
    withLeft: {
      paddingStart: spacing[4],
    },
    small: {
      minHeight: verticalScale(28),
      paddingHorizontal: spacing[10],
      paddingVertical: verticalScale(2),
      gap: spacing[4],
    },
    smallWithLeft: {
      paddingStart: spacing[8],
    },
    selected: {
      backgroundColor: colors.INK,
      borderColor: colors.INK,
    },
    title: {
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
    smallTitle: {
      fontSize: moderateScale(12),
      lineHeight: moderateScale(16),
    },
    selectedTitle: {
      color: colors.WHITE,
    },
    feature: {
      backgroundColor: colors.LIME_TINT,
      borderColor: colors.LIME_TINT,
    },
    featureSelected: {
      borderColor: colors.LIME_TINT_BORDER,
    },
    featureTitle: {
      color: colors.LIME_TINT_TEXT,
    },
    success: {
      backgroundColor: colors.SUCCESS_BG,
      borderColor: colors.SUCCESS_BG,
    },
    successTitle: {
      color: colors.SUCCESS_TEXT,
    },
    warning: {
      backgroundColor: colors.WARNING_BG,
      borderColor: colors.WARNING_BG,
    },
    warningTitle: {
      color: colors.WARNING_TEXT,
    },
    danger: {
      backgroundColor: colors.DANGER_BG,
      borderColor: colors.DANGER_BG,
    },
    dangerTitle: {
      color: colors.DANGER,
    },
  });
