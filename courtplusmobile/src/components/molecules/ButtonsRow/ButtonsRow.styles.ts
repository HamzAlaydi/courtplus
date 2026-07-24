import { StyleSheet } from "react-native";
import { spacing } from "utils";
import { ColorsType } from "theme";

export default (colors: ColorsType) =>
  StyleSheet.create({
    buttonContainer: {
      flexDirection: "row",
      gap: spacing[16],
    },
    button: {
      flex: 1,
    },
    primaryButton: {
      borderColor: colors.MED_GREY_2,
    },
    primaryButtonText: {
      color: colors.SLATE_GRAY,
    },
  });
