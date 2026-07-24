import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gameWidget: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
      backgroundColor: colors.LIGHT_BLUE,
      width: horizontalScale(107),
    },
    sportsLevelTitle: {
      color: colors.SUBMARINE,
      marginTop: verticalScale(22),
      marginBottom: verticalScale(7),
    },
    sportsLevelContainer: {
      flexDirection: "row",
      gap: spacing[24],
      alignItems: "center",
      marginTop: verticalScale(13),
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
      borderColor: colors.LIGHT_BLUE,
      borderWidth: 1,
      backgroundColor: "transparent",
      width: horizontalScale(120),
    },
    level: {
      width: horizontalScale(100),
      color: colors.SLATE_GRAY,
    },
    addGameText: {
      color: colors.SLATE_GRAY,
    },
  });
