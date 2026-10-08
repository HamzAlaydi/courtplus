import { Platform, StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

// On Android `elevation` decides z-order, not tree order. With this
// commented out the snackbar was painted UNDERNEATH any elevated floating
// button - on the Open Match screen the "Start a match" CTA covered it, so a
// rejection like "your level doesn't match" arrived as unreadable text
// bleeding out from behind a lime pill. 24 puts it above app chrome.
const shadowing = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  android: {
    elevation: 24,
  },
  default: {},
});

export default (colors: ColorsType, hasBottomBar: boolean) =>
  StyleSheet.create({
    container: {
      // NOT absolutely positioned: react-native-flash-message already places
      // this at the bottom of the screen, and an absolute child with bottom:0
      // collapsed inside it and fought that placement.
      marginHorizontal: horizontalScale(10),
      // Clears the floating action buttons that several screens pin to the
      // bottom edge.
      marginBottom: verticalScale(hasBottomBar ? 20 : 72),
      backgroundColor: colors.INK,
      borderRadius: Radius.tile,
      paddingHorizontal: horizontalScale(16),
      paddingVertical: verticalScale(14),
      ...shadowing,
    },
    messageContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    message: {
      color: colors.WHITE,
      // Was a fixed 250, which silently truncated any longer message. The
      // close button keeps its own size because this only takes the slack.
      flex: 1,
      marginEnd: horizontalScale(12),
    },
    action: {
      color: colors.INK,
    },
    actionButton: {
      backgroundColor: colors.LIME,
      borderRadius: Radius.pill,
      paddingHorizontal: spacing[14],
      minHeight: verticalScale(32),
      justifyContent: "center",
    },
    closeButton: {
      width: spacing[28],
      height: spacing[28],
      borderRadius: spacing[14],
      backgroundColor: colors.ON_INK_SURFACE,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      width: spacing[10],
      height: spacing[10],
      resizeMode: "contain",
      tintColor: colors.ON_INK_MUTED,
    },
  });
