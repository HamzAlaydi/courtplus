import { StyleSheet } from "react-native";
import { Layout } from "theme";
import { verticalScale } from "utils";

export default StyleSheet.create({
  container: {
    gap: verticalScale(16),
    paddingBottom: verticalScale(8),
  },
  sessionOverviewContainer: {
    paddingHorizontal: Layout.gutter,
  },
});
