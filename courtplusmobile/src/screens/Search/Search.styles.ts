import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
    },
    header: {
      paddingHorizontal: spacing[24],
      justifyContent: "space-between",
    },
    input: {
      marginTop: verticalScale(20),
      marginHorizontal: spacing[24],
    },
    tabs: {
      marginTop: verticalScale(20),
    },
    sportChips: {
      paddingHorizontal: spacing[24],
      paddingTop: verticalScale(12),
    },
    results: {
      paddingHorizontal: spacing[24],
      marginTop: verticalScale(35),
      color: colors.GRAYISH_BLUE,
    },
    listContainer: {
      paddingTop: verticalScale(32),
      paddingHorizontal: spacing[24],
      paddingBottom: verticalScale(40),
    },
    separator: {
      marginTop: verticalScale(16),
    },
    notifications: {
      height: spacing[40],
      width: spacing[40],
      backgroundColor: colors.GHOST_WHITE,
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
  });
