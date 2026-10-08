import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: horizontalScale(4),
    },
    label: {
      color: colors.INK,
    },
    value: {
      color: colors.MUTED,
    },
  });
