import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: -verticalScale(50),
      left: 0,
      borderRadius: horizontalScale(100),
      height: horizontalScale(104),
      width: horizontalScale(104),
    },
    cameraContainer: {
      position: "absolute",
      bottom: 0,
      right: spacing[10],
      backgroundColor: colors.GREEN_YELLOWISH,
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: spacing[50],
      justifyContent: "center",
      alignItems: "center",
    },
    cameraIcon: {
      height: verticalScale(19),
      width: spacing[22],
    },
    image: {
      width: horizontalScale(104),
      height: horizontalScale(104),
      borderRadius: horizontalScale(100),
    },
  });
