import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.DEEP,
      borderWidth: 1,
      borderColor: colors.ON_INK_LINE,
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: horizontalScale(22),
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: spacing[20],
      height: spacing[20],
      borderRadius: spacing[10],
      resizeMode: "cover",
    },
  });
