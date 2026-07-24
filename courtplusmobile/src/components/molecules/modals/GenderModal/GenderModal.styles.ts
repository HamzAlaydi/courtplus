import { StyleSheet } from "react-native";
import { spacing, verticalScale } from "utils";

export default StyleSheet.create({
  content: {
    gap: verticalScale(30),
    paddingTop: verticalScale(50),
    paddingHorizontal: spacing[6],
  },
  button: {
    marginTop: verticalScale(46),
  },
});
