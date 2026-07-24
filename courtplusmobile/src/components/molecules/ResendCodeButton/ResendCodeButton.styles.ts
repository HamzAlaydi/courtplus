import { StyleSheet } from "react-native";
import { ColorsType } from "theme";

export default (colors: ColorsType) =>
  StyleSheet.create({
    text: {
      color: colors.GREEN_YELLOWISH,
    },
    button: {
      borderWidth: 1,
      borderColor: colors.WHITE,
    },
  });
