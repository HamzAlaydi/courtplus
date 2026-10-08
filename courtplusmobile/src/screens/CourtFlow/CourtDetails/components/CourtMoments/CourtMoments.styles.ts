import { StyleSheet } from "react-native";
import { Layout } from "theme";
import { spacing, verticalScale } from "utils";

export default StyleSheet.create({
  emptyContainer: {
    marginTop: verticalScale(12),
  },
  listContent: {
    paddingHorizontal: spacing[12],
  },
  loader: {
    backgroundColor: "transparent",
    paddingHorizontal: Layout.gutter,
  },
});
