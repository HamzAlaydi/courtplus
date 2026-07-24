import { StyleSheet } from "react-native";
import { verticalScale } from "utils";

export default StyleSheet.create({
  content: {
    marginTop: verticalScale(40),
  },
  bottomContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
