import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.WHITE,
    },
    content: {
      paddingBottom: verticalScale(24),
    },
    title: {
      marginTop: verticalScale(29),
    },
    bioTitle: {
      color: colors.SUBMARINE,
      marginBottom: verticalScale(10),
      marginTop: verticalScale(30),
    },
    fullName: {
      color: colors.BACKGROUND,
      marginTop: verticalScale(55),
    },
    username: {
      color: colors.SLATE_GRAY,
      marginTop: verticalScale(3),
    },
    divider: {
      backgroundColor: colors.MED_GREY,
      height: 1,
      width: "100%",
      marginTop: verticalScale(24),
    },
    sportsLevelTitle: {
      color: colors.SUBMARINE,
      marginVertical: verticalScale(20),
    },
    addGame: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing[16],
      gap: spacing[8],
    },
    addGameText: {
      color: colors.SLATE_GRAY,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: spacing[16],
      alignItems: "center",
      marginTop: verticalScale(24),
    },
    button: {
      flex: 1,
    },
    skipButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.MED_GREY_2,
    },
    buttonText: {
      color: colors.SLATE_GRAY,
    },
    cover: {
      height: verticalScale(172),
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      marginTop: verticalScale(13),
    },
    coverText: {
      color: colors.SLATE_GRAY,
      marginTop: verticalScale(4),
      marginBottom: verticalScale(13),
    },
    bio: {
      marginTop: verticalScale(30),
    },
    header: {
      marginTop: verticalScale(13),
    },
  });
