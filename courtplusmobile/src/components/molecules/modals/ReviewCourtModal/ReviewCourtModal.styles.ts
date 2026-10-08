import { StyleSheet } from "react-native";
import { ColorsType, Radius, Typography } from "theme";
import {
  horizontalScale,
  isRTL,
  moderateScale,
  spacing,
  verticalScale,
} from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      alignItems: "center",
      gap: verticalScale(4),
      paddingTop: verticalScale(4),
    },
    title: {
      textAlign: "center",
      color: colors.INK,
    },
    court: {
      textAlign: "center",
      color: colors.MUTED,
    },
    hint: {
      textAlign: "center",
      marginTop: verticalScale(16),
      color: colors.MUTED,
      lineHeight: moderateScale(21),
    },
    starContainer: {
      alignItems: "center",
      marginTop: verticalScale(14),
    },
    starImage: {
      width: horizontalScale(40),
      height: horizontalScale(40),
    },
    inputContainer: {
      ...Typography.headline3.regular,
      height: verticalScale(104),
      marginTop: verticalScale(22),
      paddingHorizontal: spacing[14],
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(12),
      color: colors.INK,
      textAlign: isRTL ? "right" : "left",
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.input,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    button: {
      marginTop: verticalScale(20),
    },
    buttonIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    buttonIconDisabled: {
      tintColor: colors.FAINT,
    },
    laterButton: {
      marginTop: verticalScale(4),
    },
  });
