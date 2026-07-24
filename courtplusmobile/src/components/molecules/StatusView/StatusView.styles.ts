import { StyleSheet } from "react-native";
import { horizontalScale, spacing, verticalScale } from "utils";

export default StyleSheet.create({
  button: {
    marginTop: verticalScale(40),
  },
  title: {
    marginTop: verticalScale(64),
  },
  secondImage: {
    position: "absolute",
    right: 0,
    bottom: -verticalScale(8),
  },
  image: {
    width: horizontalScale(128),
    height: horizontalScale(128),
    borderRadius: horizontalScale(100),
  },
});
