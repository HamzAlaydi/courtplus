import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const SLOT_SIZE = horizontalScale(34);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing[14],
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(14),
      gap: verticalScale(12),
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    dateBlock: {
      width: horizontalScale(58),
      paddingVertical: verticalScale(8),
      borderRadius: Radius.input,
      backgroundColor: colors.INK,
      alignItems: "center",
      justifyContent: "center",
    },
    dateBlockDay: {
      color: colors.LIME,
    },
    dateBlockNumber: {
      color: colors.WHITE,
    },
    dateBlockMonth: {
      color: colors.ON_INK_MUTED,
    },
    infoColumn: {
      flex: 1,
      gap: verticalScale(2),
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing[6],
    },
    mutedText: {
      color: colors.MUTED,
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    locationIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    locationText: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[6],
    },
    sportIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    playersRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      paddingVertical: verticalScale(10),
      paddingHorizontal: spacing[10],
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.input,
    },
    slots: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 1,
    },
    slot: {
      width: SLOT_SIZE,
      height: SLOT_SIZE,
      borderRadius: SLOT_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.SUBTLE,
      backgroundColor: colors.DIVIDER,
    },
    slotOverlap: {
      marginStart: -spacing[8],
    },
    emptySlot: {
      backgroundColor: colors.CARD,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.HANDLE,
      alignItems: "center",
      justifyContent: "center",
    },
    emptySlotIcon: {
      width: horizontalScale(10),
      height: horizontalScale(10),
      resizeMode: "contain",
      tintColor: colors.FAINT,
    },
    moreSlot: {
      backgroundColor: colors.INK,
      alignItems: "center",
      justifyContent: "center",
    },
    moreSlotText: {
      color: colors.WHITE,
    },
    countPill: {
      paddingHorizontal: spacing[10],
      paddingVertical: verticalScale(3),
      borderRadius: Radius.pill,
      backgroundColor: colors.CARD,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      minHeight: verticalScale(44),
      paddingTop: verticalScale(12),
      borderTopWidth: 1,
      borderTopColor: colors.DIVIDER,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing[4],
      flexShrink: 1,
    },
    button: {
      minHeight: verticalScale(44),
      paddingHorizontal: spacing[22],
    },
  });
