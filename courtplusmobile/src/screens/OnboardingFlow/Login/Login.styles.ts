import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType, top: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: verticalScale(top),
      paddingBottom: verticalScale(26),
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing[34],
      paddingHorizontal: spacing[24],
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: spacing[26],
    },
    input: {
      backgroundColor: colors.DARK_GREEN,
      height: verticalScale(61),
      borderRadius: spacing[12],
      marginTop: verticalScale(17.53),
    },
    footerText: {
      marginTop: verticalScale(30),
      marginBottom: verticalScale(24),
    },
    socialContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[26],
      justifyContent: "center",
      paddingTop: verticalScale(17),
    },
    orContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[16],
      paddingTop: verticalScale(14),
    },
    divider: {
      height: 1,
      width: spacing[40],
      backgroundColor: colors.GREEN_YELLOWISH,
      flex: 1,
    },
    button: {
      marginTop: verticalScale(16.47),
    },
    socialButton: {
      height: verticalScale(44),
      width: spacing[48],
      backgroundColor: colors.DARK_GREEN,
      borderRadius: spacing[12],
    },
    or: {
      color: colors.GREEN_YELLOWISH,
      marginBottom: verticalScale(4),
    },
    logo: {
      width: horizontalScale(180),
      height: verticalScale(52),
    },
    keyboard: {
      flexGrow: 1,
    },
  });
