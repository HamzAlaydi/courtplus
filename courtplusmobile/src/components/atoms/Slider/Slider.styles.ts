import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    thumb: {
      width: spacing[12],
      height: spacing[12],
      borderColor: colors.BLACK,
      borderWidth: 2,
      borderRadius: spacing[50],
      backgroundColor: colors.GREEN_YELLOWISH,
    },
  });
