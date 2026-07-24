import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    leadingComponent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    content: {
      paddingTop: verticalScale(22),
      paddingHorizontal: spacing[24],
    },
    layersContainer: {
      width: spacing[40],
      height: spacing[40],
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.GHOST_WHITE,
      borderRadius: spacing[40],
    },
    layersIcon: {
      tintColor: colors.BLACK,
    },
    header: {
      paddingHorizontal: spacing[24],
      gap: 0,
      justifyContent: "space-between",
    },
    scrollContent: {
      paddingHorizontal: 0,
      paddingBottom: 0,
    },
    tabs: {
      marginTop: verticalScale(28),
    },
    tab: {
      width: horizontalScale(140),
      alignItems: "center",
    },
    tabsContent: {
      paddingHorizontal: spacing[16],
      backgroundColor: colors.LIGHT_GREY,
      flex: 1,
      paddingTop: verticalScale(20),
    },
  });
