import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    emptyImage: {
      width: horizontalScale(90),
      height: horizontalScale(99),
      tintColor: colors.SLATE_GRAY,
    },
    listContainer: {
      paddingTop: verticalScale(52),
      paddingBottom: verticalScale(20),
    },
    separator: {
      marginTop: verticalScale(22),
    },
    container: {
      paddingBottom: 0,
    },
    content: {
      width: horizontalScale(141),
      color: colors.SLATE_GRAY,
    },
  });
