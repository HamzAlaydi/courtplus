import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const NOTCH_SIZE = horizontalScale(20);

export default (colors: ColorsType) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: verticalScale(140),
    },
    content: {
      marginTop: verticalScale(16),
      gap: verticalScale(18),
    },
    title: {
      color: colors.INK,
    },
    ticket: {
      backgroundColor: colors.CARD,
      borderRadius: Radius.cardLarge,
      ...Shadows.raised,
    },
    courtImage: {
      width: "100%",
      height: verticalScale(150),
      borderTopLeftRadius: Radius.cardLarge,
      borderTopRightRadius: Radius.cardLarge,
      backgroundColor: colors.DIVIDER,
    },
    infoContainer: {
      paddingHorizontal: spacing[16],
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(14),
      gap: verticalScale(4),
    },
    courtName: {
      color: colors.INK,
    },
    branchContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    branchIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    branchName: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    perforation: {
      height: NOTCH_SIZE,
      justifyContent: "center",
    },
    perforationLine: {
      marginHorizontal: NOTCH_SIZE,
      borderTopWidth: 1.5,
      borderColor: colors.LINE,
      borderStyle: "dashed",
    },
    notch: {
      position: "absolute",
      width: NOTCH_SIZE,
      height: NOTCH_SIZE,
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
    },
    notchStart: {
      start: -NOTCH_SIZE / 2,
    },
    notchEnd: {
      end: -NOTCH_SIZE / 2,
    },
    detailsContainer: {
      paddingHorizontal: spacing[16],
      paddingTop: verticalScale(10),
      paddingBottom: verticalScale(18),
      gap: verticalScale(14),
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    iconTile: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: Radius.input,
      backgroundColor: colors.LIME_TINT,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    detailText: {
      flex: 1,
      gap: verticalScale(2),
    },
    label: {
      color: colors.MUTED,
    },
    value: {
      color: colors.INK,
    },
    noteContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[8],
      paddingHorizontal: spacing[4],
    },
    noteIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.MUTED,
      marginTop: verticalScale(1),
    },
    description: {
      flex: 1,
      color: colors.MUTED,
    },
    layout: {
      flex: 1,
      backgroundColor: colors.GROUND,
    },
  });
