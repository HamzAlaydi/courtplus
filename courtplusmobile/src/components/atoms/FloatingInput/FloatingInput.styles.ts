import { StyleSheet } from "react-native";
import { ColorsType, getFontType, Radius, Typography } from "theme";
import {
  horizontalScale,
  isAndroid,
  isRTL,
  spacing,
  verticalScale,
} from "utils";

/**
 * Two surfaces: the default sits on dark screens (deep field, lime focus),
 * `greyBackground` sits on light screens (white field, ink focus).
 */
export default (colors: ColorsType, greyBackground: boolean) =>
  StyleSheet.create({
    container: {
      maxHeight: verticalScale(61),
      backgroundColor: greyBackground ? colors.CARD : colors.DEEP,
      borderRadius: Radius.input,
      paddingStart: spacing[16],
      paddingEnd: horizontalScale(20),
      paddingVertical: verticalScale(10),
      flexDirection: "row",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: greyBackground ? colors.LINE : colors.ON_INK_LINE,
    },
    focusedContainer: {
      borderColor: greyBackground ? colors.INK : colors.LIME,
    },
    errorContainer: {
      borderColor: colors.DANGER,
      backgroundColor: greyBackground ? colors.DANGER_BG : colors.DEEP,
    },
    label: {
      ...Typography.chip.regular,
      color: greyBackground ? colors.MUTED : colors.ON_INK_MUTED,
      textAlign: "left",
    },
    input: {
      ...Typography.fields.semiBold,
      color: greyBackground ? colors.INK : colors.WHITE,
      padding: 0,
      textAlign: isRTL ? "right" : "left",
      lineHeight: isAndroid ? (isRTL ? verticalScale(20) : undefined) : 0,
      marginTop: verticalScale(1),
      flex: 1,
    },
    labelMargin: {
      marginTop: verticalScale(13),
    },
    error: {
      fontFamily: getFontType("regular"),
      color: colors.DANGER,
      marginTop: verticalScale(6),
      textAlign: "left",
    },
    icon: {
      alignSelf: "center",
      marginEnd: horizontalScale(10),
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: verticalScale(4),
      gap: spacing[6],
      paddingBottom: verticalScale(18),
    },
    inputWrapper: {
      width: "100%",
      paddingEnd: horizontalScale(14),
    },
  });
