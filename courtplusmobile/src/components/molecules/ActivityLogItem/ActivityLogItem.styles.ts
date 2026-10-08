import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[12],
    },
    imageContainer: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: horizontalScale(20),
      borderWidth: 2,
      borderColor: colors.CARD,
      backgroundColor: colors.INK,
    },
    details: {
      flex: 1,
      gap: verticalScale(4),
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(12),
      backgroundColor: colors.CARD,
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    description: {
      flexShrink: 1,
    },
    court: {
      color: colors.INK,
    },
    timestamp: {
      color: colors.MUTED,
    },
  });
