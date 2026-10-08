import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    star: {
      marginEnd: spacing[2],
    },
    filled: {
      tintColor: colors.STAR,
    },
    empty: {
      tintColor: colors.HANDLE,
    },
  });
