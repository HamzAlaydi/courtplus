import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      gap: verticalScale(22),
    },
    timeSection: {
      gap: verticalScale(10),
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    sectionIconContainer: {
      width: horizontalScale(28),
      height: horizontalScale(28),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME_TINT,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    sectionTitle: {
      color: colors.INK,
    },
    slotsContainer: {
      gap: spacing[8],
    },
    slotsRow: {
      flexDirection: "row",
      gap: spacing[8],
    },
    slotPlaceholder: {
      flex: 1,
    },
    timeSlotContainer: {
      flex: 1,
      minHeight: verticalScale(44),
      borderRadius: Radius.medium,
      alignItems: "center",
      justifyContent: "center",
    },
    slotFill: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: Radius.medium,
      borderWidth: 1,
      borderColor: colors.LINE,
      backgroundColor: colors.CARD,
    },
    disabledSlot: {
      backgroundColor: colors.GROUND,
      borderColor: colors.GROUND,
    },
    slotText: {
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
      textAlign: "center",
    },
    disabledSlotText: {
      color: colors.FAINT,
      textDecorationLine: "line-through",
      textDecorationColor: colors.FAINT,
    },
    emptyState: {
      flex: 0,
      paddingVertical: verticalScale(40),
    },
    emptyIcon: {
      width: horizontalScale(72),
      height: horizontalScale(72),
      resizeMode: "contain",
      tintColor: colors.FAINT,
    },
  });
