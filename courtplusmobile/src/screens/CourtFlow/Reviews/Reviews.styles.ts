import { StyleSheet } from "react-native";
import { ColorsType, Layout } from "theme";
import { verticalScale } from "utils";

export default (_colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
    },
    header: {
      paddingHorizontal: Layout.gutter,
    },
    separator: {
      height: verticalScale(12),
    },
    listContainer: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(18),
      paddingBottom: verticalScale(32),
    },
  });
