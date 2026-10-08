import { StyleSheet } from "react-native";
import { ColorsType } from "theme";

export default (colors: ColorsType) =>
  StyleSheet.create({
    video: {
      backgroundColor: colors.INK,
      overflow: "hidden",
    },
  });
