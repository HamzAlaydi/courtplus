import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: `${colors.BACKGROUND}E5`,
    },
    progress: {
      borderRadius: spacing[6],
    },
    logo: {
      width: horizontalScale(114),
      height: verticalScale(121),
      position: "absolute",
    },
  });
