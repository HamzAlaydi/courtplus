import { StyleSheet } from "react-native";
import { ColorsType, Layout } from "theme";
import { horizontalScale, spacing } from "utils";

const RADIO_SIZE = horizontalScale(24);
const DOT_SIZE = horizontalScale(10);

export default (colors: ColorsType, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      minHeight: Layout.touch,
    },
    title: {
      flex: 1,
      color: isDark ? colors.INK : colors.WHITE,
    },
    radio: {
      width: RADIO_SIZE,
      height: RADIO_SIZE,
      borderRadius: RADIO_SIZE / 2,
      borderWidth: 1.5,
      borderColor: isDark ? colors.HANDLE : colors.ON_INK_MUTED,
      justifyContent: "center",
      alignItems: "center",
    },
    radioOn: {
      backgroundColor: isDark ? colors.INK : colors.LIME,
      borderColor: isDark ? colors.INK : colors.LIME,
    },
    selected: {
      backgroundColor: isDark ? colors.LIME : colors.INK,
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
    },
  });
