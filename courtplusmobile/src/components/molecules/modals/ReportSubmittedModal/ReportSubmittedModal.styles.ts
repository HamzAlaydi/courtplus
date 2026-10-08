import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      paddingTop: verticalScale(8),
      paddingBottom: verticalScale(8),
      paddingHorizontal: spacing[12],
    },
    iconBadge: {
      width: horizontalScale(84),
      height: horizontalScale(84),
      borderRadius: Radius.pill,
      backgroundColor: colors.SUCCESS_BG,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: horizontalScale(60),
      height: horizontalScale(60),
      resizeMode: "contain",
    },
    title: {
      marginTop: verticalScale(16),
      textAlign: "center",
      color: colors.INK,
    },
    description: {
      marginTop: verticalScale(8),
      textAlign: "center",
      color: colors.MUTED,
      lineHeight: moderateScale(21),
    },
  });
