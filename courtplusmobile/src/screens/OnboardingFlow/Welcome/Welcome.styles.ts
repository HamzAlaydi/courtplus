import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.BACKGROUND,
    },
    content: {
      alignItems: "center",
    },
    logo: {
      width: horizontalScale(138),
      height: horizontalScale(175),
      marginTop: verticalScale(161),
    },
    languageContainer: {
      marginTop: verticalScale(101),
      width: "100%",
    },
    title: {
      color: colors.WHITE,
      textAlign: "center",
      marginBottom: verticalScale(19),
    },
    button: {
      marginTop: verticalScale(101),
    },
    arabicButton: {
      marginBottom: verticalScale(14),
    },
  });
