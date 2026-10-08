import { StyleSheet } from "react-native";
import { ColorsType, Layout, Shadows } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      start: 0,
      end: 0,
      backgroundColor: colors.CARD,
      paddingTop: verticalScale(14),
      paddingHorizontal: Layout.gutter,
      gap: verticalScale(12),
      ...Shadows.bar,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
    },
    summaryLabel: {
      flex: 1,
      color: colors.MUTED,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing[4],
    },
    amount: {
      color: colors.INK,
    },
    amountUnit: {
      color: colors.MUTED,
    },
    buttonsContainer: {
      flexDirection: "row",
      gap: spacing[10],
    },
    button: {
      flex: 1,
      paddingHorizontal: spacing[12],
    },
    nextButton: {
      flex: 1.4,
    },
  });
