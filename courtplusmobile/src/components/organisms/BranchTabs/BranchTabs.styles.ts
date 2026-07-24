import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: verticalScale(12),
      marginTop: verticalScale(5.5),
    },
    header: {
      marginBottom: verticalScale(16),
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    iconContainer: {
      backgroundColor: colors.GHOST_WHITE,
      width: spacing[40],
      height: spacing[40],
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: spacing[24],
      height: spacing[24],
      tintColor: colors.BLACK,
    },
    contentContainer: {
      paddingHorizontal: spacing[24],
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(32),
      backgroundColor: colors.GHOST_WHITE,
    },
    separator: {
      marginTop: verticalScale(20),
    },
  });
