import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.INK,
    },
    title: {
      color: colors.WHITE,
      marginTop: verticalScale(36),
    },
    button: {
      marginTop: verticalScale(24),
    },
    buttonDisabled: {
      backgroundColor: colors.ON_INK_SURFACE,
      borderColor: colors.ON_INK_LINE,
    },
    buttonDisabledText: {
      color: colors.ON_INK_MUTED,
    },
    footer: {
      paddingTop: verticalScale(16),
    },
    formContainer: {
      gap: spacing[12],
      paddingTop: verticalScale(20),
    },
    dateOfBirthContainer: {
      flexDirection: "row",
      gap: spacing[12],
    },
    input: {
      flex: 1,
    },
    logo: {
      width: horizontalScale(132),
      height: horizontalScale(38),
      resizeMode: "contain",
    },
  });
