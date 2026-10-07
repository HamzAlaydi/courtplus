import { StyleSheet } from "react-native";
import { ColorsType, Typography } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
      paddingBottom: 0,
    },
    infoHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingEnd: spacing[8],
    },
    participantsContainer: {
      marginTop: verticalScale(9),
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[30],
      paddingEnd: horizontalScale(23),
    },
    content: {
      paddingStart: spacing[16],
    },
    date: {
      marginTop: verticalScale(4.18),
      color: colors.BLACK,
    },
    restrictionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[8],
      marginTop: verticalScale(8),
    },
    restrictionBadge: {
      backgroundColor: colors.LIGHT_GREY,
      borderRadius: spacing[8],
      paddingHorizontal: horizontalScale(10),
      paddingVertical: verticalScale(4),
    },
    restrictionText: {
      color: colors.SLATE_GRAY,
    },
    locationContainer: {
      marginTop: verticalScale(15),
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    greyText: {
      color: colors.SLATE_GRAY,
    },
    amountContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    bottomContainer: {
      borderTopColor: colors.LIGHT_GREY,
      borderTopWidth: 1,
      paddingStart: spacing[10],
      marginTop: verticalScale(10),
      flexDirection: "row",
      justifyContent: "space-between",
    },
    divider: {
      width: horizontalScale(1),
      height: verticalScale(25),
      backgroundColor: colors.MED_GREY_3,
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      paddingStart: spacing[6],
    },
    timerIcon: {
      width: spacing[12],
      height: spacing[12],
      tintColor: colors.SLATE_GRAY,
    },
    button: {
      height: verticalScale(43),
      borderEndEndRadius: spacing[12],
      borderStartEndRadius: 0,
      borderEndStartRadius: 0,
      borderStartStartRadius: 0,
    },
    buttonText: {
      ...Typography.chip.medium,
    },
    sportContainer: {
      height: spacing[24],
      width: spacing[24],
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.BLACK,
      borderRadius: spacing[12],
    },
    sportIcon: {
      tintColor: colors.GREEN_YELLOWISH,
      width: horizontalScale(21),
      height: horizontalScale(21),
    },
    bottomContainerNoBookNow: {
      paddingVertical: verticalScale(12),
    },
  });
