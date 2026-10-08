import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { spacing, verticalScale } from "utils";

export const TAB_BAR_CONTENT_HEIGHT = 66;
export const TAB_PILL_WIDTH = 52;
export const TAB_PILL_HEIGHT = 30;

export default (colors: ColorsType) =>
  StyleSheet.create({
    tabBarStyle: {
      backgroundColor: colors.CARD,
      borderTopColor: colors.LINE,
      paddingTop: 8,
      paddingHorizontal: spacing[6],
      elevation: 0,
      shadowOpacity: 0,
    },
    tabBarItem: {
      paddingTop: 0,
    },
    tabBarIcon: {
      width: TAB_PILL_WIDTH,
      height: TAB_PILL_HEIGHT,
    },
    iconWrapper: {
      width: TAB_PILL_WIDTH,
      height: TAB_PILL_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    activePill: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME,
    },
    tabBarLabel: {
      color: colors.MUTED,
    },
    tabBarLabelActive: {
      color: colors.INK,
    },
    communityTabBarLabel: {
      width: spacing[60],
    },
    tabBar: {
      textAlign: "center",
      marginTop: verticalScale(4),
    },
    scene: {
      backgroundColor: colors.GROUND,
    },
  });
