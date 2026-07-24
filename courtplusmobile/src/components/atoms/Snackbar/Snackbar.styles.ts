import { Platform, StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const shadowing = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  android: {
    elevation: 4,
  },
});

export default (colors: ColorsType, hasBottomBar: boolean) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: hasBottomBar ? verticalScale(20) : 0,
      left: horizontalScale(10),
      right: horizontalScale(10),
      backgroundColor: colors.BACKGROUND,
      borderRadius: spacing[4],
      paddingHorizontal: horizontalScale(16),
      paddingVertical: verticalScale(14),
      // ...shadowing,
    },
    messageContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    message: {
      color: colors.WHITE,
      width: horizontalScale(250),
    },
    action: {
      color: colors.GREEN_YELLOWISH,
    },
    icon: {
      tintColor: colors.MED_RED,
    },
  });
