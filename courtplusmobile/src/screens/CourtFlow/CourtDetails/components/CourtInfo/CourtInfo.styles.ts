import { StyleSheet } from "react-native";
import { horizontalScale, verticalScale } from "utils";

export default StyleSheet.create({
  container: {
    marginTop: verticalScale(28),
    paddingHorizontal: horizontalScale(24),
  },
  sessionOverviewContainer: {
    marginTop: verticalScale(34),
  },
});
