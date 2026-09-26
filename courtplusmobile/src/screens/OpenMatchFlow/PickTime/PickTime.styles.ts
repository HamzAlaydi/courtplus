import { StyleSheet } from "react-native";
import { spacing, verticalScale } from "utils";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    marginTop: verticalScale(40),
  },
  // Clears the pinned Confirm bar so the last row of slots is still tappable
  // once the list is scrolled to the end.
  scrollViewContent: {
    paddingBottom: verticalScale(40),
  },
  // `flex: 1` here used to make this container swallow the remaining space
  // and fight the slot list for it. Pinned below the scroll view instead,
  // matching the BookingButtons footer used elsewhere.
  bottomContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing[24],
    paddingTop: verticalScale(13),
    paddingBottom: verticalScale(39),
    borderTopColor: "#EFEFEF",
    borderTopWidth: 1,
  },
});
