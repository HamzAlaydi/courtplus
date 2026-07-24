import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.DARK_GREEN,
      width: spacing[40],
      height: spacing[40],
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: spacing[20],
      height: spacing[20],
    },
  });
