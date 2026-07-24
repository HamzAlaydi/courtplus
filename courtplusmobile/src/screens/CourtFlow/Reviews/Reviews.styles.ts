import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    separator: {
      marginVertical: verticalScale(15.5),
      borderWidth: 1,
      borderColor: colors.LIGHT_GREY,
    },
    listContainer: {
      marginTop: verticalScale(31),
    },
  });
