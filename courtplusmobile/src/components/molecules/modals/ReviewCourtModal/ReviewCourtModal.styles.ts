import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      alignItems: "center",
    },
    inputContainer: {
      borderWidth: 1,
      borderColor: colors.LIGHT_BLUE,
      borderRadius: spacing[12],
      paddingVertical: verticalScale(12.5),
      paddingHorizontal: horizontalScale(8),
      marginTop: verticalScale(41),
      backgroundColor: "#FCFBFC",
      height: verticalScale(89.5),
    },
    hint: {
      textAlign: "center",
      marginTop: verticalScale(25),
      color: colors.SLATE_GRAY,
    },
    court: {
      color: colors.SLATE_GRAY,
    },
    button: {
      marginTop: verticalScale(26),
    },
    starImage: {
      width: horizontalScale(44),
      height: verticalScale(44),
    },
    starContainer: {
      alignItems: "center",
      marginTop: verticalScale(15.08),
    },
  });
