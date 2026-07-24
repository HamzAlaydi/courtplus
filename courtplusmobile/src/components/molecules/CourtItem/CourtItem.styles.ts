import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    courtCard: {
      paddingHorizontal: spacing[4],
      paddingTop: verticalScale(4),
    },
    imageBg: {
      height: verticalScale(255),
      alignItems: "flex-end",
      justifyContent: "flex-end",
      paddingEnd: spacing[8],
      paddingBottom: verticalScale(6),
    },
    image: {
      borderRadius: spacing[12],
    },
    branchContainer: {
      flexDirection: "row",
      paddingHorizontal: spacing[8],
      paddingTop: verticalScale(32),
      justifyContent: "space-between",
      alignItems: "center",
    },
    locationContainer: {
      flexDirection: "row",
      paddingBottom: verticalScale(5),
      paddingHorizontal: spacing[8],
      paddingTop: verticalScale(16),
      justifyContent: "space-between",
    },
    rowContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    brancName: {
      maxWidth: horizontalScale(240),
      color: colors.BLACK,
    },
    rating: {
      color: colors.SLATE_GRAY,
      marginTop: isRTL ? verticalScale(4) : 0,
    },
    distance: {
      color: colors.GRAYISH_BLUE,
      marginTop: isRTL ? verticalScale(4) : 0,
    },
    location: {
      color: colors.SLATE_GRAY,
      marginTop: isRTL ? verticalScale(4) : 0,
    },
    bookmarkContainer: {
      backgroundColor: colors.MED_BLACK,
      width: spacing[36],
      height: spacing[36],
      justifyContent: "center",
      alignItems: "center",
      borderRadius: spacing[30],
    },
    bookmarkIcon: {
      tintColor: colors.WHITE,
    },
  });
