import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: horizontalScale(5),
      justifyContent: "center",
      alignItems: "center",
    },
    divider: {
      width: horizontalScale(12),
      height: 1,
      backgroundColor: colors.LIGHT_BLUE,
    },
    activeStep: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      backgroundColor: colors.LIGHT_BLUE,
      borderRadius: horizontalScale(36),
      alignItems: "center",
      justifyContent: "center",
    },
    completedStep: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      backgroundColor: colors.BLACK,
      borderRadius: horizontalScale(36),
      alignItems: "center",
      justifyContent: "center",
    },
    inactiveStep: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderColor: colors.LIGHT_BLUE,
      borderWidth: 1,
      borderRadius: horizontalScale(36),
      alignItems: "center",
      justifyContent: "center",
    },
    inactiveStepText: {
      color: colors.GREY,
    },
    image: {
      tintColor: colors.WHITE,
    },
  });
