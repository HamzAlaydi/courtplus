import { StyleSheet } from "react-native";
import { ColorsType, Layout } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.INK,
      paddingHorizontal: Layout.gutter,
      paddingBottom: verticalScale(12),
    },
    footerText: {
      textAlign: "center",
      marginTop: verticalScale(28),
      marginBottom: verticalScale(20),
    },
    footerText1: {
      color: colors.ON_INK_MUTED,
      textAlign: "center",
    },
    footerText2: {
      color: colors.WHITE,
      textAlign: "center",
      textDecorationLine: "underline",
      textDecorationColor: colors.LIME,
    },
    otpView: {
      marginTop: verticalScale(28),
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    codeContainer: {
      marginTop: verticalScale(12),
      textAlign: "left",
    },
    codeText: {
      color: colors.ON_INK_MUTED,
    },
    codeText1: {
      color: colors.WHITE,
    },
    keyboard: {
      flexGrow: 1,
    },
    title: {
      color: colors.WHITE,
    },
    logo: {
      width: horizontalScale(132),
      height: horizontalScale(38),
      resizeMode: "contain",
    },
  });
