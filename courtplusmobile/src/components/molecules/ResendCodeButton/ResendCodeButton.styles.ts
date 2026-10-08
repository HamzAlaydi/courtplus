import { StyleSheet } from "react-native";
import { ColorsType } from "theme";

/**
 * The default look sits on dark screens; `isDark` (light screens) uses the
 * plain bordered and secondary button variants.
 */
export default (colors: ColorsType) =>
  StyleSheet.create({
    text: {
      fontVariant: ["tabular-nums"],
    },
    onInk: {
      backgroundColor: "transparent",
      borderColor: colors.ON_INK_LINE,
    },
    onInkReady: {
      backgroundColor: colors.ON_INK_SURFACE,
      borderColor: colors.ON_INK_MUTED,
    },
    onInkText: {
      color: colors.ON_INK_MUTED,
    },
    onInkReadyText: {
      color: colors.WHITE,
    },
  });
