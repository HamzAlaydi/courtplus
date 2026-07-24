import { StyleSheet } from "react-native";
import { spacing, verticalScale } from "utils";

export default StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[30],
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    bottom: verticalScale(4),
  },
});
