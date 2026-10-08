import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      gap: spacing[8],
    },
    iconContainer: {
      backgroundColor: colors.GROUND,
      height: horizontalScale(30),
      width: horizontalScale(30),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: horizontalScale(15),
    },
    selectedIconContainer: {
      backgroundColor: colors.LIME,
    },
    icon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    selectedIcon: {
      tintColor: colors.INK,
    },
  });
