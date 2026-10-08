import { StyleSheet } from "react-native";
import { Layout } from "theme";
import { verticalScale } from "utils";

export default StyleSheet.create({
  list: {
    marginHorizontal: -Layout.gutter,
  },
  listContainer: {
    paddingHorizontal: Layout.gutter,
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(24),
  },
  separator: {
    height: verticalScale(10),
  },
});
