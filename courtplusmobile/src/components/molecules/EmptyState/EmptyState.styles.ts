import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: verticalScale(20),
    },
    text: {
      width: horizontalScale(229),
      textAlign: "center",
      color: colors.DARK_BLUE,
    },
  });
