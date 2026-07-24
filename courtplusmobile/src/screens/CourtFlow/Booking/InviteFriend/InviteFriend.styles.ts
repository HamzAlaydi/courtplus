import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(21),
    },
    title: {
      color: colors.SLATE_GRAY,
      marginTop: verticalScale(25),
      textAlign: "center",
      letterSpacing: 0.1,
    },
    input: {
      marginTop: verticalScale(32),
    },
    description: {
      marginTop: verticalScale(10),
      color: colors.GREY,
      marginStart: horizontalScale(20),
    },
    slotsContainer: {
      flexDirection: "row",
      gap: horizontalScale(33),
      alignItems: "center",
      justifyContent: "center",
      marginTop: verticalScale(30),
    },
    separator: {
      marginTop: verticalScale(8),
    },
    listContent: {
      paddingTop: verticalScale(25),
      paddingBottom: verticalScale(100),
    },
    profileCard: {
      marginTop: 0,
    },
  });
