import { StyleSheet } from "react-native";
import { spacing, verticalScale } from "utils";

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: verticalScale(172),
    // justifyContent: "flex-end",
  },
  imageStyle: {
    width: "100%",
    height: verticalScale(172),
  },
  metric: {
    marginTop: verticalScale(30),
    justifyContent: "flex-end",
    paddingHorizontal: spacing[30],
  },
  button: {
    position: "absolute",
    right: spacing[24],
  },
  profile: {
    marginStart: spacing[24],
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  cameraContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  imageContent: {
    justifyContent: "flex-end",
    flex: 1,
  },
});
