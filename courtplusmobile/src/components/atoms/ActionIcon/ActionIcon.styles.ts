import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      width: horizontalScale(35),
      height: horizontalScale(35),
      backgroundColor: colors.LIGHT_GREY,
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
  });
