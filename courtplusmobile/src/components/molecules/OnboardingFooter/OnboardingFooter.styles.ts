import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: verticalScale(20),
    },
    orContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    divider: {
      height: 1,
      flex: 1,
      backgroundColor: colors.ON_INK_LINE,
    },
    or: {
      color: colors.ON_INK_MUTED,
    },
    socialContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[12],
      paddingTop: verticalScale(16),
    },
    socialButtonContainer: {
      width: horizontalScale(52),
      height: horizontalScale(52),
      borderRadius: horizontalScale(26),
      backgroundColor: colors.DEEP,
      borderWidth: 1,
      borderColor: colors.ON_INK_LINE,
      justifyContent: "center",
      alignItems: "center",
    },
    socialButton: {
      width: horizontalScale(22),
      height: horizontalScale(22),
      resizeMode: "contain",
    },
    footerText: {
      textAlign: "center",
      marginTop: verticalScale(24),
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
  });
