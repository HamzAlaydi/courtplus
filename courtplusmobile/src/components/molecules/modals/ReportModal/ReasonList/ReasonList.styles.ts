import { StyleSheet } from "react-native";
import { horizontalScale, isRTL, verticalScale } from "utils";

export default StyleSheet.create({
  container: {
    paddingTop: verticalScale(34),
    gap: verticalScale(30),
  },
  listContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginEnd: horizontalScale(5),
  },
  title: {
    width: horizontalScale(254),
  },
  arrowIcon: {
    transform: [{ scale: isRTL ? 1 : -1 }],
  },
});
