import { StyleSheet } from "react-native";
import { ColorsType, Typography } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    tabBarLabel: {
      color: colors.MED_GREY,
    },
    tabBarLabelActive: {
      color: colors.BLACK,
    },
    communityTabBarLabel: {
      width: spacing[60],
    },
    tabBar: {
      textAlign: "center",
    },
  });
