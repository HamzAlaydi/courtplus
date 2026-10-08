import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, isRTL, spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    title: {
      flex: 1,
      color: colors.INK,
    },
    iconButton: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.GROUND,
      borderRadius: Radius.pill,
    },
    arrowIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
      transform: [{ scaleX: isRTL ? -1 : 1 }],
    },
    closeIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
  });
