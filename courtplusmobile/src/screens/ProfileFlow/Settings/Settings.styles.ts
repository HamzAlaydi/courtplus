import { StyleSheet } from "react-native";
import { ColorsType, Layout } from "theme";
import { horizontalScale, isRTL, spacing, verticalScale } from "utils";

export const themedStyles = (colors: ColorsType) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: verticalScale(32),
    },
    content: {
      paddingTop: verticalScale(8),
    },
    section: {
      marginTop: verticalScale(14),
    },
    title: {
      color: colors.MUTED,
      marginTop: verticalScale(8),
      marginBottom: verticalScale(8),
      paddingHorizontal: spacing[4],
    },
    bottomContainer: {
      gap: verticalScale(10),
      marginTop: Layout.sectionGap,
    },
    icon: {
      tintColor: colors.INK,
    },
    dangerIcon: {
      tintColor: colors.DANGER,
    },
    dangerText: {
      color: colors.DANGER,
    },
    rightContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    chevron: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.FAINT,
      transform: [{ scaleX: isRTL ? 1 : -1 }],
    },
  });

export default StyleSheet.create({
  languageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
  },
  languageImage: {
    width: horizontalScale(18),
    height: horizontalScale(12),
    borderRadius: 2,
  },
});
