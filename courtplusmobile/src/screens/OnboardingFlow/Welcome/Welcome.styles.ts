import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.INK,
    },
    logoContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(24),
    },
    logo: {
      width: horizontalScale(118),
      height: horizontalScale(150),
      resizeMode: "contain",
    },
    languageContainer: {
      width: "100%",
      gap: spacing[12],
    },
    title: {
      color: colors.WHITE,
      textAlign: "center",
      marginBottom: verticalScale(8),
    },
    button: {
      marginTop: verticalScale(32),
      marginBottom: verticalScale(16),
    },
  });
