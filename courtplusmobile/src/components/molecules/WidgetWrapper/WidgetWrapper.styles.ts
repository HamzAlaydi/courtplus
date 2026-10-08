import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.CARD,
      padding: spacing[14],
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
  });
