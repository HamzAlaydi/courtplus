import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(2),
    },
    label: {
      color: colors.SLATE_GRAY,
    },
    value: {
      color: colors.SLATE_GRAY,
    },
  });
