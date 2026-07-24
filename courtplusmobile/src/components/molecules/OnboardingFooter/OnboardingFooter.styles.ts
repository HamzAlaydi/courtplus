import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: verticalScale(14),
    },
    orContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[16],
    },
    divider: {
      height: 1,
      width: spacing[40],
      backgroundColor: colors.GREEN_YELLOWISH,
      flex: 1,
    },
    socialButton: {
      height: verticalScale(27),
      width: spacing[28],
    },
    socialButtonContainer: {
      padding: spacing[10],
      backgroundColor: colors.DARK_GREEN,
      borderRadius: spacing[12],
      justifyContent: "center",
      alignItems: "center",
    },
    or: {
      color: colors.GREEN_YELLOWISH,
      marginBottom: verticalScale(4),
    },
    socialContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[26],
      justifyContent: "center",
      paddingTop: verticalScale(17),
    },
    footerText: {
      marginTop: verticalScale(30),
      marginBottom: verticalScale(24),
    },
    footerText1: {
      color: colors.GREY,
      textAlign: "center",
    },
    footerText2: {
      color: colors.GREEN_YELLOWISH,
    },
  });
