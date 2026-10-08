import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      justifyContent: "space-between",
      backgroundColor: colors.CARD,
    },
    topBar: {
      flexDirection: "row",
      paddingHorizontal: Layout.gutter,
    },
    content: {
      alignItems: "center",
      width: "100%",
      gap: verticalScale(18),
      paddingHorizontal: Layout.gutter,
    },
    badge: {
      width: horizontalScale(64),
      height: horizontalScale(64),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME,
      alignItems: "center",
      justifyContent: "center",
      ...Shadows.card,
    },
    badgeIcon: {
      width: horizontalScale(28),
      height: horizontalScale(28),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    copy: {
      alignItems: "center",
      gap: verticalScale(8),
      paddingHorizontal: spacing[8],
    },
    title: {
      textAlign: "center",
      color: colors.INK,
    },
    description: {
      textAlign: "center",
      color: colors.MUTED,
      maxWidth: horizontalScale(280),
    },
    buttonRow: {
      width: "100%",
      marginTop: verticalScale(4),
    },
  });
