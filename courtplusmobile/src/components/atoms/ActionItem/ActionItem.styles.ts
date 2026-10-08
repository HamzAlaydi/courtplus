import { ColorsType } from "theme";
import { StyleSheet } from "react-native";
import { horizontalScale, spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    iconTile: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: horizontalScale(12),
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    image: {
      width: spacing[18],
      height: spacing[18],
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
      flexShrink: 1,
    },
    title: {
      color: colors.INK,
      flexShrink: 1,
    },
  });
