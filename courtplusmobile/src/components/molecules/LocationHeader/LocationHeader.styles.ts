import { StyleSheet } from "react-native";
import { ColorsType, getFontType } from "theme";
import { horizontalScale, isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    notificationContainer: {
      height: spacing[40],
      width: spacing[40],
      backgroundColor: colors.GHOST_WHITE,
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
    },

    locationTitle: {
      color: colors.GRAYISH_BLUE,
      fontFamily: getFontType("semiBold"),
    },
    locationText: {
      color: colors.SLATE_GRAY,
      width: horizontalScale(140),
      marginTop: isRTL ? verticalScale(4) : 0,
    },
  });
