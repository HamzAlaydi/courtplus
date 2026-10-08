import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale } from "utils";

const STEP_SIZE = horizontalScale(36);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: horizontalScale(6),
      justifyContent: "center",
      alignItems: "center",
    },
    divider: {
      width: horizontalScale(18),
      height: 2,
      borderRadius: Radius.pill,
      backgroundColor: colors.LINE,
    },
    completedDivider: {
      backgroundColor: colors.INK,
    },
    activeStep: {
      width: STEP_SIZE,
      height: STEP_SIZE,
      backgroundColor: colors.INK,
      borderRadius: STEP_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    activeStepText: {
      color: colors.WHITE,
      textAlign: "center",
    },
    completedStep: {
      width: STEP_SIZE,
      height: STEP_SIZE,
      backgroundColor: colors.LIME,
      borderRadius: STEP_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    inactiveStep: {
      width: STEP_SIZE,
      height: STEP_SIZE,
      backgroundColor: colors.CARD,
      borderColor: colors.LINE,
      borderWidth: 1,
      borderRadius: STEP_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    inactiveStepText: {
      color: colors.MUTED,
      textAlign: "center",
    },
    image: {
      tintColor: colors.INK,
    },
  });
