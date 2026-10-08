import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(18),
      gap: verticalScale(14),
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
      paddingTop: verticalScale(16),
    },
    card: {
      paddingHorizontal: spacing[16],
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(16),
      gap: verticalScale(10),
    },
    courtContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing[12],
    },
    courtName: {
      flex: 1,
      color: colors.INK,
    },
    gameIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
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
    divider: {
      height: 1,
      backgroundColor: colors.DIVIDER,
      marginVertical: verticalScale(4),
    },
    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
    },
    dateIconTile: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: Radius.medium,
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    dateIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    dateText: {
      flex: 1,
    },
    durationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
      paddingHorizontal: spacing[10],
      paddingVertical: verticalScale(4),
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
    },
    durationIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    levelContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[6],
    },
    levelIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    paymentOptionItem: {
      minHeight: verticalScale(60),
      paddingHorizontal: spacing[16],
      paddingVertical: verticalScale(12),
      backgroundColor: colors.CARD,
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.INK,
    },
  });
