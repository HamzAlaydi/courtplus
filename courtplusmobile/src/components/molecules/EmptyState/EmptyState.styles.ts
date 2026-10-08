import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing[24],
      paddingVertical: verticalScale(32),
    },
    image: {
      marginBottom: verticalScale(20),
    },
    text: {
      maxWidth: horizontalScale(260),
      textAlign: "center",
      color: colors.INK,
    },
    subtitle: {
      maxWidth: horizontalScale(280),
      marginTop: verticalScale(6),
      textAlign: "center",
      color: colors.MUTED,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(19),
    },
    button: {
      marginTop: verticalScale(20),
    },
  });
