import { StyleSheet } from "react-native";
import { verticalScale } from "utils";

export default StyleSheet.create({
  container: {
    marginTop: verticalScale(37),
    flex: 1,
  },
  description: {
    marginTop: verticalScale(24),
  },
  textArea: {
    height: verticalScale(135),
  },
  bottomContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
