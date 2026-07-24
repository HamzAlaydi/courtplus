import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: horizontalScale(60),
      height: horizontalScale(60),
    },
    title: {
      marginTop: verticalScale(15),
    },
    description: {
      marginTop: verticalScale(13.9),
      textAlign: "center",
      width: horizontalScale(270),
      color: colors.SLATE_GRAY,
    },
  });
