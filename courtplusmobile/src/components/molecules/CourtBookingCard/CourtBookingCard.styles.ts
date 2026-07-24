import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    confirmationContainer: {
      marginTop: verticalScale(16),
    },
    infoContainer: {
      flexDirection: "row",
      gap: spacing[10],
    },
    locationContainer: {
      flexDirection: "row",
      gap: spacing[4],
      alignItems: "center",
      marginTop: verticalScale(10),
      marginBottom: verticalScale(21),
    },
    dateContainer: {
      flexDirection: "row",
      gap: spacing[12],
      alignItems: "center",
    },
    iconContainer: {
      flexDirection: "row",
      gap: spacing[4],
      alignItems: "center",
    },
    icon: {
      width: horizontalScale(11),
      height: horizontalScale(11),
      tintColor: colors.SLATE_GRAY,
    },
    slotsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      marginTop: verticalScale(20),
    },
    courtImage: {
      width: horizontalScale(149),
      borderRadius: spacing[8],
      height: verticalScale(124),
    },
    courtName: {
      width: horizontalScale(137),
    },
    branchName: {
      color: colors.SLATE_GRAY,
    },
    branchNameText: {
      maxWidth: horizontalScale(109),
    },
    locationIcon: {
      width: horizontalScale(13),
      height: horizontalScale(13),
      tintColor: colors.SLATE_GRAY,
    },
    dateText: {
      width: horizontalScale(103),
    },
  });
