import { StyleSheet } from "react-native";
import { ColorsType, getFontType } from "theme";
import { horizontalScale, isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: verticalScale(7),
      paddingBottom: verticalScale(14),
      width: horizontalScale(210),
    },
    name: {
      marginTop: verticalScale(13),
      color: colors.BLACK,
      marginHorizontal: spacing[2],
    },
    image: {
      width: "100%",
      height: verticalScale(133),
      borderRadius: spacing[8],
      alignItems: "flex-end",
      padding: spacing[8],
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
    distanceContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      paddingHorizontal: spacing[2],
      marginTop: verticalScale(8),
    },
    distance: {
      color: colors.GRAYISH_BLUE,
      marginTop: isRTL ? verticalScale(4) : 0,
    },
    rowContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: verticalScale(4),
    },
    innerRowContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      paddingHorizontal: spacing[2],
      paddingTop: verticalScale(2),
    },
    branchName: {
      maxWidth: horizontalScale(130),
      color: colors.SLATE_GRAY,
      marginTop: isRTL ? verticalScale(4) : 0,
    },
    rating: {
      color: colors.SLATE_GRAY,
      fontFamily: getFontType("semiBold"),
      marginTop: isRTL ? verticalScale(4) : 0,
    },
    acIcon: {
      width: spacing[14],
      height: spacing[14],
      tintColor: colors.SLATE_GRAY,
    },
  });
