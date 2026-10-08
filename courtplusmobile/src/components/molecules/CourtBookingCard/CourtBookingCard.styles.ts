import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    confirmationContainer: {
      padding: spacing[14],
      borderRadius: Radius.card,
      backgroundColor: colors.CARD,
      gap: verticalScale(14),
      ...Shadows.card,
    },
    infoContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    courtImage: {
      width: horizontalScale(76),
      height: horizontalScale(76),
      borderRadius: Radius.input,
      backgroundColor: colors.DIVIDER,
    },
    courtInfo: {
      flex: 1,
      gap: verticalScale(4),
    },
    courtName: {
      color: colors.INK,
    },
    locationContainer: {
      flexDirection: "row",
      gap: spacing[4],
      alignItems: "center",
    },
    locationIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    branchName: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    detailsRow: {
      flexDirection: "row",
      gap: spacing[8],
    },
    detailTile: {
      flex: 1,
      gap: verticalScale(4),
      paddingVertical: verticalScale(10),
      paddingHorizontal: spacing[12],
      borderRadius: Radius.input,
      backgroundColor: colors.SUBTLE,
    },
    iconContainer: {
      flexDirection: "row",
      gap: spacing[6],
      alignItems: "center",
    },
    icon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    label: {
      color: colors.MUTED,
    },
    value: {
      color: colors.INK,
    },
    divider: {
      height: 1,
      backgroundColor: colors.DIVIDER,
    },
    slotsContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-around",
    },
  });
