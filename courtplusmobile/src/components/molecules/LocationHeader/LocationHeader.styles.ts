import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { horizontalScale, moderateScale, spacing } from "utils";

export default (colors: ColorsType, isDark: boolean) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing[12],
    },
    locationPill: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 1,
      gap: spacing[6],
      height: horizontalScale(36),
      paddingHorizontal: spacing[12],
      borderRadius: Radius.pill,
      backgroundColor: isDark ? colors.ON_INK_SURFACE : colors.CARD,
      borderWidth: isDark ? 0 : 1,
      borderColor: colors.LINE,
    },
    loadingPill: {
      minWidth: horizontalScale(96),
    },
    pinIcon: {
      width: horizontalScale(13),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: isDark ? colors.LIME : colors.INK,
    },
    locationText: {
      flexShrink: 1,
      maxWidth: horizontalScale(200),
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
      color: isDark ? colors.WHITE : colors.INK,
    },
    chevronIcon: {
      width: horizontalScale(11),
      height: horizontalScale(11),
      resizeMode: "contain",
      tintColor: isDark ? colors.WHITE : colors.MUTED,
    },
    trailingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
    },
    notificationContainer: {
      height: Layout.touch,
      width: Layout.touch,
      borderRadius: Radius.pill,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? colors.ON_INK_SURFACE : colors.CARD,
      ...(isDark ? Shadows.none : Shadows.subtle),
    },
    bellIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: isDark ? colors.WHITE : colors.INK,
    },
  });
