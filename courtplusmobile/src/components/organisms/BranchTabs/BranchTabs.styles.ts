import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: Layout.sectionGap,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
      paddingHorizontal: Layout.gutter,
      marginBottom: verticalScale(14),
    },
    iconContainer: {
      backgroundColor: colors.LIME_TINT,
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: Radius.pill,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    title: {
      flexShrink: 1,
    },
    countBadge: {
      minWidth: horizontalScale(24),
      height: horizontalScale(24),
      paddingHorizontal: spacing[8],
      borderRadius: Radius.pill,
      backgroundColor: colors.INK,
      alignItems: "center",
      justifyContent: "center",
    },
    countText: {
      color: colors.WHITE,
    },
    tabs: {
      marginBottom: verticalScale(4),
    },
    contentContainer: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(32),
    },
    separator: {
      height: verticalScale(14),
    },
  });
