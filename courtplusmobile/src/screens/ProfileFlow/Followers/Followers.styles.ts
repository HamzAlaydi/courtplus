import { StyleSheet } from "react-native";
import { verticalScale } from "utils";

export default StyleSheet.create({
  listContainer: {
    paddingTop: verticalScale(24),
    paddingBottom: verticalScale(20),
  },
  separator: {
    marginTop: verticalScale(10.75),
    marginBottom: verticalScale(16),
  },
});
