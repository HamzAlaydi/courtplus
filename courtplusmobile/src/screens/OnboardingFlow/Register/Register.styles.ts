import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.BACKGROUND,
    },
    title: {
      color: colors.WHITE,
      marginTop: verticalScale(53),
    },
    button: {
      marginTop: verticalScale(26),
    },
    footer: {
      paddingTop: verticalScale(19),
    },
    formContainer: {
      gap: horizontalScale(13),
      paddingTop: verticalScale(16),
    },
    dateOfBirthContainer: {
      flexDirection: "row",
      gap: horizontalScale(13),
    },
    input: {
      flex: 1,
    },
    logo: {
      width: horizontalScale(180),
      height: verticalScale(52),
    },
  });
