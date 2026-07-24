import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    title: {
      color: colors.SLATE_GRAY,
      marginTop: verticalScale(25),
      textAlign: "center",
      letterSpacing: 0.1,
    },
    description: {
      marginTop: verticalScale(16),
      textAlign: "center",
      width: horizontalScale(287.54),
      alignSelf: "center",
    },
    content: {
      marginTop: verticalScale(21),
    },
    dateContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: verticalScale(37),
    },
    timeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: verticalScale(32),
    },
    courtContainer: {
      borderRadius: spacing[12],
      width: "100%",
      borderWidth: 1,
      borderColor: colors.LIGHT_GREY,
      paddingHorizontal: spacing[24],
      paddingBottom: verticalScale(32),
      marginTop: verticalScale(80),
    },
    date: {
      fontSize: moderateScale(24),
      color: colors.BLACK,
    },
    branchContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      paddingTop: verticalScale(16),
    },
    iconContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    icon: {
      tintColor: colors.SLATE_GRAY,
      width: spacing[28],
      height: spacing[28],
    },
    infoContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: verticalScale(90),
    },
    courtImage: {
      position: "absolute",
      zIndex: 2,
      top: 0,
      alignSelf: "center",
      marginTop: verticalScale(95),
      width: horizontalScale(170),
      height: verticalScale(136),
      borderRadius: horizontalScale(8),
    },
    courtName: {
      color: colors.BLACK,
      fontSize: moderateScale(18),
    },
    branchName: {
      color: colors.SLATE_GRAY,
    },
    dateText: {
      color: colors.SLATE_GRAY,
    },
  });
