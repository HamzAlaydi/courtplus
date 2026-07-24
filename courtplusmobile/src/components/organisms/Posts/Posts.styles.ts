import { StyleSheet } from "react-native";
import { spacing, verticalScale } from "utils";

export default StyleSheet.create({
  container: {
    paddingHorizontal: spacing[24],
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(20),
  },
  separator: {
    marginTop: verticalScale(16),
  },
});
