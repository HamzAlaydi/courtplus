import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    tabs: {
      paddingTop: verticalScale(20),
      backgroundColor: colors.WHITE,
    },
    content: {
      backgroundColor: colors.LIGHT_GREY,
      flex: 1,
    },
  });
