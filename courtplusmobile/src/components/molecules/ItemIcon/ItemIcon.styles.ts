import { StyleSheet } from "react-native";
import { horizontalScale, spacing } from "utils";

export default StyleSheet.create({
  container: {
    width: horizontalScale(104),
    height: horizontalScale(104),
    borderRadius: spacing[40],
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: horizontalScale(90),
    height: horizontalScale(90),
    borderRadius: spacing[40],
  },
});
