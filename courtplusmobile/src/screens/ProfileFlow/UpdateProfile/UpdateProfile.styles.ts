import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.WHITE,
    },
    profileImageHeader: {
      paddingHorizontal: horizontalScale(8.5),
      paddingTop: verticalScale(20),
    },
    save: {
      minHeight: verticalScale(28),
      borderRadius: spacing[40],
      paddingVertical: verticalScale(8),
      backgroundColor: colors.GHOST_WHITE,
    },
    content: {
      paddingHorizontal: 0,
      paddingBottom: verticalScale(50),
    },
    header: {
      paddingHorizontal: spacing[24],
      justifyContent: "space-between",
      alignItems: "center",
    },
    mainContent: {
      marginTop: verticalScale(50),
      paddingHorizontal: spacing[24],
    },
    fullName: {
      marginTop: verticalScale(14),
    },
    username: {
      marginTop: verticalScale(16),
    },
    dateOfBirthContainer: {
      marginTop: verticalScale(29),
      flexDirection: "row",
      gap: horizontalScale(11),
    },
    flexOne: {
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.MED_GREY,
      marginTop: verticalScale(28),
    },
    sportsLevelTitle: {
      color: colors.SUBMARINE,
      marginTop: verticalScale(22),
    },
    sportsLevelContainer: {
      flexDirection: "row",
      gap: spacing[24],
      alignItems: "center",
      marginTop: verticalScale(20),
    },
    sportsLevelWidget: {
      flexDirection: "row",
      gap: spacing[8],
    },
    addSportContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
      marginTop: verticalScale(13),
    },
    levelContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: horizontalScale(131),
    },
    saveText: {
      color: colors.BLACK,
    },
    bio: {
      marginTop: verticalScale(22.74),
    },
  });
