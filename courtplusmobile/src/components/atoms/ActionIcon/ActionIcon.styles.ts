import { StyleSheet } from "react-native";
import { ColorsType, Shadows } from "theme";
import { horizontalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      backgroundColor: colors.CARD,
      borderRadius: horizontalScale(22),
      justifyContent: "center",
      alignItems: "center",
      ...Shadows.subtle,
    },
    icon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
  });
