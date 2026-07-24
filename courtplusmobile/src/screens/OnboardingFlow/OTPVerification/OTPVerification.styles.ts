import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing[24],
      paddingBottom: verticalScale(26),
    },
    footerText: {
      marginTop: verticalScale(62),
    },
    footerText1: {
      color: colors.GREY,
      textAlign: "center",
    },
    footerText2: {
      color: colors.GREEN_YELLOWISH,
    },
    otpView: {
      marginTop: verticalScale(26),
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    codeContainer: {
      marginTop: verticalScale(16),
    },
    codeText: {
      color: colors.SLATE_GRAY,
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
      width: horizontalScale(180),
      height: verticalScale(52),
    },
  });
