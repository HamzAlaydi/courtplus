import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(35),
    },
    input: {
      marginTop: verticalScale(59),
    },
    button: {
      marginTop: verticalScale(30),
    },
  });
