import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    slider: {
      flex: 1,
    },
    page: {
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      height: verticalScale(300),
    },
  });
