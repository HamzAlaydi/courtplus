import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
      backgroundColor: colors.WHITE,
    },
    metrics: {
      alignSelf: "flex-end",
      paddingTop: verticalScale(30),
    },
    content: {
      paddingHorizontal: spacing[24],
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
      marginTop: verticalScale(22),
    },
    reviewsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(15),
      marginTop: verticalScale(18),
    },
    sessionOverviewContainer: {
      marginTop: verticalScale(20),
    },
    sessionOverviewColumn: {
      marginEnd: horizontalScale(62.5),
    },
    title: {
      marginTop: verticalScale(18),
    },
    locationText: {
      color: colors.GREEN,
    },
    addressText: {
      color: colors.SLATE_GRAY,
      width: horizontalScale(246),
    },
    loadingContainer: {
      flex: 1,
      paddingTop: verticalScale(32),
      backgroundColor: colors.WHITE,
    },
  });
