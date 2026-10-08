import { StyleSheet } from "react-native";
import { Typography, ColorsType, Radius } from "theme";
import { horizontalScale, moderateScale, verticalScale } from "utils";

/**
 * `isDark` is true on light screens (the dark digits variant): white cells
 * with an ink focus. Otherwise the cells sit on a dark screen: deep cells
 * with a lime focus.
 */
export default (colors: ColorsType, isDark: boolean) =>
  StyleSheet.create({
    container: {
      borderRadius: Radius.input,
      backgroundColor: isDark ? colors.CARD : colors.DEEP,
      borderWidth: 1,
      borderColor: isDark ? colors.LINE : colors.ON_INK_LINE,
      height: verticalScale(58),
      width: horizontalScale(47.83),
    },
    focusedContainer: {
      borderWidth: 1.5,
      borderColor: isDark ? colors.INK : colors.LIME,
    },
    filledContainer: {
      borderColor: isDark ? colors.INK : colors.ON_INK_MUTED,
    },
    pinCodeText: {
      ...Typography.displayNumber.extraBold,
      fontSize: moderateScale(22),
      color: isDark ? colors.INK : colors.WHITE,
    },
  });
