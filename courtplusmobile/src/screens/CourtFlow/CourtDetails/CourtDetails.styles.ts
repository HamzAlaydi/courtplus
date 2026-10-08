import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import {
  horizontalScale,
  isArabic,
  isRTL,
  moderateScale,
  spacing,
  verticalScale,
} from "utils";

export const HERO_HEIGHT = verticalScale(300);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.CARD,
    },
    scrollContent: {
      paddingHorizontal: 0,
      backgroundColor: colors.CARD,
    },
    hero: {
      height: HERO_HEIGHT,
      width: "100%",
      backgroundColor: colors.DIVIDER,
    },
    heroImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    heroControls: {
      position: "absolute",
      start: Layout.gutter,
      end: Layout.gutter,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    glassButton: {
      width: Layout.touch,
      height: Layout.touch,
      borderRadius: Radius.pill,
      backgroundColor: colors.GLASS_LIGHT,
      alignItems: "center",
      justifyContent: "center",
      ...Shadows.subtle,
    },
    glassIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    sheet: {
      marginTop: -Radius.sheet,
      backgroundColor: colors.CARD,
      borderTopStartRadius: Radius.sheet,
      borderTopEndRadius: Radius.sheet,
      paddingTop: verticalScale(22),
      paddingHorizontal: Layout.gutter,
      gap: verticalScale(18),
    },
    titleBlock: {
      gap: verticalScale(6),
    },
    title: {
      color: colors.INK,
      fontSize: moderateScale(isArabic ? 24 : 22),
      lineHeight: moderateScale(isArabic ? 36 : 28),
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      columnGap: spacing[14],
      rowGap: verticalScale(4),
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      minHeight: verticalScale(24),
      flexShrink: 1,
    },
    metaIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    starIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.STAR,
    },
    metaText: {
      color: colors.MUTED,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
      flexShrink: 1,
    },
    ratingText: {
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[8],
    },
    featureChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
      minHeight: verticalScale(32),
      paddingHorizontal: spacing[12],
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
    },
    featureChipHighlight: {
      backgroundColor: colors.LIME_TINT,
    },
    featureChipIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    featureChipIconHighlight: {
      tintColor: colors.LIME_TINT_TEXT,
    },
    featureChipText: {
      color: colors.INK,
    },
    featureChipTextHighlight: {
      color: colors.LIME_TINT_TEXT,
    },
    description: {
      color: colors.MUTED,
    },
    locationCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      paddingVertical: verticalScale(12),
      paddingHorizontal: spacing[12],
      borderRadius: Radius.tile,
      backgroundColor: colors.SUBTLE,
      borderWidth: 1,
      borderColor: colors.DIVIDER,
    },
    locationIconTile: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: Radius.medium,
      backgroundColor: colors.CARD,
      alignItems: "center",
      justifyContent: "center",
    },
    locationIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    locationTextColumn: {
      flex: 1,
      gap: verticalScale(2),
    },
    locationTitle: {
      color: colors.INK,
    },
    mutedText: {
      color: colors.MUTED,
    },
    chevron: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.MUTED,
      transform: [{ scaleX: isRTL ? 1 : -1 }],
    },
    bottomBar: {
      position: "absolute",
      start: 0,
      end: 0,
      bottom: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      paddingTop: verticalScale(14),
      paddingHorizontal: Layout.gutter,
      backgroundColor: colors.CARD,
      ...Shadows.bar,
    },
    priceColumn: {
      flexShrink: 1,
      gap: verticalScale(2),
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing[4],
    },
    price: {
      color: colors.INK,
    },
    bookButton: {
      flex: 1,
    },
    skeletonSheet: {
      flex: 1,
    },
    skeleton: {
      backgroundColor: "transparent",
    },
    unavailableImage: {
      width: horizontalScale(48),
      height: horizontalScale(48),
      resizeMode: "contain",
      tintColor: colors.FAINT,
    },
  });
