import { StyleSheet } from "react-native";
import { horizontalScale, spacing, verticalScale } from "utils";

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  week: {
    flexDirection: "row",
    paddingHorizontal: spacing[10],
    gap: horizontalScale(8),
  },
  title: {
    marginBottom: verticalScale(15),
  },
  separator: {
    marginStart: horizontalScale(8),
  },
});
