import { StyleSheet } from "react-native";
import { ColorsType, Typography } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(27),
    },
    detailsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    branchName: {
      color: colors.SLATE_GRAY,
    },
    branchLocation: {
      color: colors.GRAYISH_BLUE,
    },
    description: {
      color: colors.BLACK,
      marginTop: verticalScale(20),
    },
    reviewsContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    widgetWrapper: {
      flexDirection: "row",
      gap: horizontalScale(8),
      alignItems: "center",
      backgroundColor: colors.LIGHT_BLUE,
      paddingVertical: verticalScale(13.5),
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
      borderColor: colors.LIGHT_BLUE,
      borderWidth: 1,
      borderRadius: spacing[12],
      paddingStart: spacing[8],
      paddingEnd: spacing[18],
      width: horizontalScale(214),
    },
    locationText: {
      maxWidth: horizontalScale(155),
    },
    locationMainContainer: {
      flexDirection: "row",
      gap: spacing[6],
    },
    chipContainer: {
      width: horizontalScale(163),
      position: "absolute",
      bottom: 0,
      alignSelf: "center",
      marginBottom: verticalScale(37),
    },
    calendarContainer: {
      width: spacing[44],
      height: spacing[44],
      backgroundColor: colors.BLACK,
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
    chipText: {
      ...Typography.chip.bold,
    },
    bookmarkContainer: {
      backgroundColor: colors.LIGHT_GREY,
      width: spacing[30],
      height: spacing[30],
      justifyContent: "center",
      alignItems: "center",
      borderRadius: spacing[30],
    },
    infoContainer: {
      backgroundColor: colors.WHITE,
    },
    scrollContent: {
      paddingHorizontal: 0,
      backgroundColor: colors.LIGHT_GREY,
    },
    mainContent: {
      paddingHorizontal: horizontalScale(24),
    },
    container: {
      flex: 1,
    },
    bookmarkIcon: {
      tintColor: colors.SLATE_GRAY,
    },
  });
