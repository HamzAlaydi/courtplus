import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.GHOST_WHITE,
      padding: spacing[12],
      borderRadius: spacing[12],
      borderWidth: 1,
      borderColor: colors.LIGHT_GREY,
    },
  });
