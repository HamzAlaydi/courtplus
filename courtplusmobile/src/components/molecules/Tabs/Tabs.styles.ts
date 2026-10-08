import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: spacing[16],
    },
    scroll: {
      flexGrow: 0,
    },
    contentContainer: {
      flexGrow: 1,
      flexDirection: "row",
      padding: horizontalScale(4),
      gap: horizontalScale(4),
      backgroundColor: colors.CARD,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    tab: {
      flexGrow: 1,
      minHeight: verticalScale(40),
      paddingHorizontal: spacing[16],
      borderRadius: Radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    tabBackground: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: Radius.pill,
    },
    title: {
      color: colors.MUTED,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
      textAlign: "center",
    },
    selectedTitle: {
      color: colors.WHITE,
    },
  });
