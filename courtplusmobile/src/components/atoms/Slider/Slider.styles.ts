import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    thumb: {
      width: horizontalScale(22),
      height: horizontalScale(22),
      borderColor: colors.INK,
      borderWidth: 2,
      borderRadius: horizontalScale(11),
      backgroundColor: colors.LIME,
    },
  });
