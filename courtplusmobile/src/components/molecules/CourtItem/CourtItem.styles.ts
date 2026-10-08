import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import {
  horizontalScale,
  isRTL,
  moderateScale,
  spacing,
  verticalScale,
} from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    courtCard: {
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      borderRadius: Radius.cardLarge,
      ...Shadows.raised,
    },
    imageBg: {
      height: verticalScale(156),
      borderTopLeftRadius: Radius.cardLarge,
      borderTopRightRadius: Radius.cardLarge,
      overflow: "hidden",
      backgroundColor: colors.DIVIDER,
    },
    image: {
      borderTopLeftRadius: Radius.cardLarge,
      borderTopRightRadius: Radius.cardLarge,
    },
    bookmarkContainer: {
      position: "absolute",
      top: spacing[12],
      end: spacing[12],
      backgroundColor: colors.GLASS_LIGHT,
      width: horizontalScale(40),
      height: horizontalScale(40),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: horizontalScale(20),
    },
    bookmarkIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    featureRow: {
      position: "absolute",
      start: spacing[12],
      bottom: spacing[12],
      end: spacing[12],
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[6],
    },
    featurePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      backgroundColor: colors.GLASS_LIGHT,
      borderRadius: Radius.pill,
      paddingHorizontal: spacing[10],
      paddingVertical: verticalScale(4),
    },
    featureIcon: {
      width: horizontalScale(13),
      height: horizontalScale(13),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    featureText: {
      color: colors.INK,
    },
    body: {
      paddingHorizontal: spacing[14],
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(16),
      gap: verticalScale(10),
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing[8],
    },
    titleColumn: {
      flex: 1,
      gap: verticalScale(4),
    },
    brancName: {
      color: colors.INK,
    },
    rowContainer: {
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
    location: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      paddingTop: verticalScale(2),
    },
    starIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.STAR,
    },
    rating: {
      color: colors.INK,
      fontSize: moderateScale(13),
    },
    reviewsCount: {
      color: colors.MUTED,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[6],
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      borderTopWidth: 1,
      borderTopColor: colors.DIVIDER,
      paddingTop: verticalScale(12),
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing[4],
      flexShrink: 1,
    },
    price: {
      color: colors.INK,
    },
    priceUnit: {
      color: colors.MUTED,
    },
    ctaButton: {
      minHeight: verticalScale(44),
      paddingHorizontal: spacing[22],
    },
    arrowButton: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: horizontalScale(22),
      backgroundColor: colors.LIME,
      alignItems: "center",
      justifyContent: "center",
    },
    arrowIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.INK,
      transform: [{ scaleX: isRTL ? 1 : -1 }],
    },
  });
