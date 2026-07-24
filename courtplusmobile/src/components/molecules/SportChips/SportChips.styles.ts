import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      gap: spacing[6],
    },
    iconContainer: {
      backgroundColor: colors.WHITE,
      padding: spacing[6],
      height: spacing[36],
      width: spacing[36],
      justifyContent: "center",
      alignItems: "center",
      borderRadius: spacing[32],
    },
    selectedIconContainer: {
      backgroundColor: colors.BLACK,
    },
    icon: {
      tintColor: colors.BLACK,
    },
    selectedIcon: {
      tintColor: colors.GREEN_YELLOWISH,
    },
  });
