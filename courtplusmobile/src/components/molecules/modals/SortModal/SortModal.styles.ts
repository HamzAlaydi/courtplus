import { StyleSheet } from "react-native";
import { verticalScale } from "utils";

export default StyleSheet.create({
  content: {
    paddingTop: verticalScale(40),
    paddingEnd: verticalScale(8),
  },
  radioButton: {
    marginBottom: verticalScale(20),
  },
  buttons: {
    paddingVertical: verticalScale(24),
  },
});
