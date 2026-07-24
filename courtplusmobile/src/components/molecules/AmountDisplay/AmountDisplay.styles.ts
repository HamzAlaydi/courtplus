import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(4),
    },
    text: {
      marginTop: verticalScale(4),
      color: colors.BLACK,
    },
    amountText: {
      color: colors.BLACK,
    },
  });
