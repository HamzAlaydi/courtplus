import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      width: horizontalScale(104),
      height: horizontalScale(104),
      borderRadius: Radius.pill,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.CARD,
    },
    image: {
      width: horizontalScale(90),
      height: horizontalScale(90),
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
    },
  });
