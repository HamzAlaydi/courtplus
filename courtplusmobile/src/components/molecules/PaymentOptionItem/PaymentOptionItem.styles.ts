import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing[12],
      minHeight: verticalScale(68),
      paddingVertical: verticalScale(12),
      paddingHorizontal: spacing[14],
      borderRadius: Radius.tile,
      borderWidth: 1.5,
      borderColor: colors.LINE,
      backgroundColor: colors.CARD,
    },
    selectedContainer: {
      borderColor: colors.INK,
    },
    rowContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    radioContainer: {
      width: horizontalScale(22),
      height: horizontalScale(22),
      borderRadius: Radius.pill,
      borderWidth: 1.5,
      borderColor: colors.HANDLE,
      justifyContent: "center",
      alignItems: "center",
    },
    radioSelected: {
      borderWidth: 2,
      borderColor: colors.INK,
    },
    radio: {
      width: horizontalScale(10),
      height: horizontalScale(10),
      borderRadius: Radius.pill,
      backgroundColor: colors.INK,
    },
    cardContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
    },
    cardIconTile: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: Radius.medium,
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    cardIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    title: {
      flex: 1,
      color: colors.INK,
    },
    amountContainer: {
      gap: spacing[4],
      flexDirection: "row",
      alignItems: "baseline",
    },
    amount: {
      color: colors.INK,
    },
    amountText: {
      color: colors.MUTED,
    },
  });
