import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(9),
    },
    dot: {
      width: horizontalScale(4),
      height: horizontalScale(4),
      borderRadius: horizontalScale(50),
      backgroundColor: colors.MED_GREY,
    },
    text: {
      color: colors.BLACK,
    },
  });
