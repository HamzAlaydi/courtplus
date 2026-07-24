import { StyleSheet } from "react-native";
import { horizontalScale, spacing, verticalScale } from "utils";

export default StyleSheet.create({
  title: {
    marginBottom: verticalScale(4),
    marginTop: verticalScale(21),
  },
  scrollContent: {
    paddingBottom: verticalScale(21),
  },
  bottomContainer: {
    gap: verticalScale(8),
    marginTop: verticalScale(21),
  },
  content: {
    paddingTop: verticalScale(50),
  },
  languageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    marginEnd: spacing[20],
  },
  languageImage: {
    width: horizontalScale(16.71),
    height: verticalScale(11.14),
  },
});
