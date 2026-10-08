import { StyleSheet } from "react-native";
import { ColorsType, Layout, Shadows } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: Layout.gutter,
    },
    bellContainer: {
      width: Layout.touch,
      height: Layout.touch,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.CARD,
      borderRadius: Layout.touch / 2,
      ...Shadows.subtle,
    },
    bellIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    scrollContent: {
      paddingHorizontal: 0,
      paddingBottom: 0,
    },
    tabs: {
      marginTop: verticalScale(18),
    },
    tab: {
      flexBasis: 0,
      flexGrow: 1,
      alignItems: "center",
    },
    tabsContent: {
      flex: 1,
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(18),
      backgroundColor: colors.GROUND,
    },
  });
