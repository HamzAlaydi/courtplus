import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
    },
    header: {
      paddingHorizontal: Layout.gutter,
    },
    input: {
      marginTop: verticalScale(14),
      marginHorizontal: Layout.gutter,
      minHeight: Layout.fieldHeight,
      ...Shadows.subtle,
    },
    searchIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    tabs: {
      marginTop: verticalScale(16),
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      marginTop: Layout.sectionGap,
      paddingHorizontal: Layout.gutter,
    },
    sectionTitle: {
      color: colors.INK,
    },
    results: {
      flexShrink: 1,
      color: colors.MUTED,
    },
    sportChips: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(12),
    },
    loader: {
      backgroundColor: "transparent",
    },
    listContainer: {
      paddingTop: verticalScale(18),
      paddingHorizontal: Layout.gutter,
      paddingBottom: verticalScale(40),
    },
    separator: {
      height: verticalScale(14),
    },
    notifications: {
      height: Layout.touch,
      width: Layout.touch,
      backgroundColor: colors.CARD,
      borderRadius: Radius.pill,
      justifyContent: "center",
      alignItems: "center",
      ...Shadows.subtle,
    },
    bellIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
  });
