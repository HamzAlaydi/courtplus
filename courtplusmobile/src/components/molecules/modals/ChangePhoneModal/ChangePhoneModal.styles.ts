import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: verticalScale(16),
    },
    centeredContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing[8],
    },
    iconBadge: {
      width: horizontalScale(64),
      height: horizontalScale(64),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME_TINT,
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: horizontalScale(28),
      height: horizontalScale(28),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    title: {
      textAlign: "center",
      marginTop: verticalScale(16),
      color: colors.INK,
    },
    description: {
      marginTop: verticalScale(8),
      color: colors.MUTED,
      textAlign: "center",
      lineHeight: moderateScale(21),
    },
    actions: {
      gap: verticalScale(10),
      marginTop: verticalScale(24),
    },
  });
