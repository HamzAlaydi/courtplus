import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      width: horizontalScale(252),
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      borderRadius: Radius.card,
      ...Shadows.card,
    },
    image: {
      width: "100%",
      height: verticalScale(132),
      borderTopLeftRadius: Radius.card,
      borderTopRightRadius: Radius.card,
      overflow: "hidden",
      backgroundColor: colors.DIVIDER,
    },
    imageRadius: {
      borderTopLeftRadius: Radius.card,
      borderTopRightRadius: Radius.card,
    },
    overlayRow: {
      position: "absolute",
      top: spacing[10],
      start: spacing[10],
      end: spacing[10],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    ratingBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      backgroundColor: colors.GLASS_DARK,
      borderRadius: Radius.pill,
      paddingHorizontal: spacing[8],
      paddingVertical: verticalScale(4),
    },
    ratingStar: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.LIME,
    },
    rating: {
      color: colors.WHITE,
    },
    trailingBadges: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
    },
    featureBadge: {
      width: horizontalScale(26),
      height: horizontalScale(26),
      borderRadius: horizontalScale(13),
      backgroundColor: colors.GLASS_LIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    featureIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    bookmarkContainer: {
      backgroundColor: colors.GLASS_LIGHT,
      width: horizontalScale(32),
      height: horizontalScale(32),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: horizontalScale(16),
    },
    bookmarkIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    body: {
      paddingHorizontal: spacing[14],
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(14),
      gap: verticalScale(6),
    },
    name: {
      color: colors.INK,
    },
    innerRowContainer: {
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
    branchName: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[8],
      marginTop: verticalScale(4),
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
      fontSize: moderateScale(11),
    },
  });
