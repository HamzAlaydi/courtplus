import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      marginTop: verticalScale(16),
      gap: verticalScale(14),
    },
    hero: {
      backgroundColor: colors.INK,
      borderRadius: Radius.cardLarge,
      padding: spacing[20],
      gap: verticalScale(10),
    },
    heroBadge: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: Radius.pill,
      backgroundColor: colors.ON_INK_SURFACE,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: verticalScale(4),
    },
    heroIcon: {
      width: horizontalScale(22),
      height: horizontalScale(22),
      resizeMode: "contain",
      tintColor: colors.LIME,
    },
    headline: {
      color: colors.WHITE,
    },
    intro: {
      color: colors.ON_INK_MUTED,
      lineHeight: moderateScale(22),
    },
    card: {
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      paddingHorizontal: spacing[16],
      paddingVertical: verticalScale(4),
      ...Shadows.card,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[12],
      paddingVertical: verticalScale(14),
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.DIVIDER,
    },
    numberBadge: {
      width: horizontalScale(30),
      height: horizontalScale(30),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME,
      justifyContent: "center",
      alignItems: "center",
    },
    number: {
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
    rowText: {
      flex: 1,
      gap: verticalScale(4),
    },
    title: {
      color: colors.INK,
    },
    body: {
      color: colors.MUTED,
      lineHeight: moderateScale(22),
    },
  });
