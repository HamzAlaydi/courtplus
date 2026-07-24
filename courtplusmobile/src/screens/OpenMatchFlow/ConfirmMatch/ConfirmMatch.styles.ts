import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(24),
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: verticalScale(21),
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      marginTop: verticalScale(15),
    },
    levelContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(5.11),
      marginTop: verticalScale(19),
    },
    levelInnerContainer: {
      borderRadius: horizontalScale(7),
      backgroundColor: "#ECEEF1",
      paddingHorizontal: horizontalScale(6),
    },
    levelIcon: {
      width: horizontalScale(11),
      height: verticalScale(11),
    },
    courtName: {
      color: colors.SLATE_GRAY,
    },
    dateIconContainer: {
      flexDirection: "row",
      gap: horizontalScale(9),
      alignItems: "center",
      marginEnd: horizontalScale(23),
    },
    card: {
      paddingStart: horizontalScale(15),
    },
    courtContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    chipContainer: {
      backgroundColor: colors.BLACK,
      padding: spacing[6],
      height: spacing[24],
      width: spacing[24],
      justifyContent: "center",
      alignItems: "center",
      borderRadius: spacing[32],
    },
    gameIcon: {
      tintColor: colors.GREEN_YELLOWISH,
      width: horizontalScale(14),
      height: horizontalScale(14),
    },
    paymentOptionItem: {
      marginTop: verticalScale(38),
    },
    locationText: {
      color: colors.SLATE_GRAY,
    },
    chip: {
      height: verticalScale(26),
    },
  });
