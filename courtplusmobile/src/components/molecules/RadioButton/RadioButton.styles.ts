import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing } from "utils";

export default (colors: ColorsType, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      color: !isDark ? colors.WHITE : colors.BLACK,
    },
    radio: {
      width: spacing[18],
      height: spacing[18],
      borderColor: !isDark ? colors.WHITE : colors.BLACK,
      borderWidth: 1,
      borderRadius: spacing[18],
      justifyContent: "center",
      alignItems: "center",
    },
    selected: {
      backgroundColor: colors.GREEN_YELLOWISH,
      width: spacing[14],
      height: spacing[14],
      borderRadius: spacing[14],
    },
  });
