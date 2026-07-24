import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    content: {
      paddingBottom: verticalScale(70),
      alignItems: "center",
      width: "100%",
      paddingHorizontal: spacing[24],
    },
    description: {
      textAlign: "center",
      color: colors.SLATE_GRAY,
      width: horizontalScale(249),
      marginTop: verticalScale(12),
    },
    button: {
      width: "100%",
      marginTop: verticalScale(22),
    },
  });
