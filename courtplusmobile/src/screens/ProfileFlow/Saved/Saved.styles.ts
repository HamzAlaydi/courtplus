import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.WHITE,
    },
    emptyContainer: {
      paddingTop: verticalScale(83.5),
    },
    listContainer: {
      paddingTop: verticalScale(20),
      paddingBottom: verticalScale(40),
    },
    separator: {
      marginTop: verticalScale(10),
    },
  });
