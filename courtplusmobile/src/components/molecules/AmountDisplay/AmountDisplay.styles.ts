import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing[4],
    },
    text: {
      color: colors.MUTED,
    },
    amountText: {
      color: colors.INK,
    },
  });
