import { StyleSheet } from "react-native";
import { ColorsType, getFontType, Typography } from "theme";
import {
  horizontalScale,
  isAndroid,
  isRTL,
  spacing,
  verticalScale,
} from "utils";

export default (colors: ColorsType, greyBackground: boolean) =>
  StyleSheet.create({
    container: {
      maxHeight: verticalScale(61),
      backgroundColor: greyBackground ? colors.GHOST_WHITE : colors.DARK_GREEN,
      borderRadius: spacing[12],
      paddingStart: spacing[20],
      paddingEnd: horizontalScale(24),
      paddingVertical: verticalScale(10),
      flexDirection: "row",
      justifyContent: "space-between",
      borderWidth: greyBackground ? 1 : 0,
      borderColor: greyBackground ? colors.LIGHT_GREY : "transparent",
    },
    errorContainer: {
      borderColor: colors.RED,
      borderWidth: 1,
      backgroundColor: colors.DARK_RED,
    },
    label: {
      ...Typography.chip.regular,
      color: colors.SUBMARINE,
      textAlign: "left",
    },
    input: {
      ...Typography.fields.semiBold,
      color: greyBackground ? colors.BLACK : colors.WHITE,
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
      color: colors.RED,
      marginTop: verticalScale(6),
      textAlign: "left",
    },
    icon: {
      alignSelf: "center",
      marginEnd: horizontalScale(14),
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
