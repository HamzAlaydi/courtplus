import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.GROUND,
    },
    slotsCard: {
      marginTop: verticalScale(20),
      paddingHorizontal: spacing[16],
      paddingTop: verticalScale(20),
      paddingBottom: verticalScale(4),
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      ...Shadows.card,
    },
    // Clears the pinned Confirm bar so the last row of slots is still tappable
    // once the list is scrolled to the end.
    scrollViewContent: {
      paddingBottom: verticalScale(28),
    },
    // Pinned below the scroll view, matching the BookingButtons footer used
    // elsewhere.
    bottomContainer: {
      backgroundColor: colors.CARD,
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(14),
      ...Shadows.bar,
    },
  });
