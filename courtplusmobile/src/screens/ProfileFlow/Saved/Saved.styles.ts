import { StyleSheet } from "react-native";
import { ColorsType, Layout } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    emptyContainer: {
      paddingTop: verticalScale(72),
    },
    list: {
      marginHorizontal: -Layout.gutter,
    },
    listContainer: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(40),
    },
    separator: {
      height: verticalScale(14),
    },
  });
