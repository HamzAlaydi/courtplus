import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.INK,
    },
    ring: {
      position: "absolute",
      width: horizontalScale(224),
      height: horizontalScale(224),
      borderRadius: horizontalScale(112),
      borderWidth: 1,
      borderColor: colors.ON_INK_LINE,
    },
    outerRing: {
      position: "absolute",
      width: horizontalScale(336),
      height: horizontalScale(336),
      borderRadius: horizontalScale(168),
      borderWidth: 1,
      borderColor: colors.ON_INK_SURFACE,
    },
    image: {
      width: horizontalScale(128),
      height: horizontalScale(128),
      resizeMode: "contain",
    },
  });
