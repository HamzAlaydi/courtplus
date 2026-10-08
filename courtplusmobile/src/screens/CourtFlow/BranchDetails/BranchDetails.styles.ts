import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius } from "theme";
import {
  horizontalScale,
  isArabic,
  moderateScale,
  spacing,
  verticalScale,
} from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.GROUND,
    },
    contentContainer: {
      flexGrow: 1,
      backgroundColor: colors.GROUND,
    },
    content: {
      backgroundColor: colors.CARD,
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(14),
      paddingBottom: Layout.sectionGap,
      gap: verticalScale(18),
      borderBottomStartRadius: Radius.sheet,
      borderBottomEndRadius: Radius.sheet,
    },
    titleBlock: {
      gap: verticalScale(6),
    },
    title: {
      fontSize: moderateScale(isArabic ? 24 : 22),
      lineHeight: moderateScale(isArabic ? 34 : 28),
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
    },
    locationIcon: {
      width: horizontalScale(11),
      height: horizontalScale(13),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    addressText: {
      flexShrink: 1,
      color: colors.MUTED,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
    starIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.STAR,
    },
    ratingText: {
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
    reviewsText: {
      flexShrink: 1,
      color: colors.MUTED,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
    stats: {
      flexDirection: "row",
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.DIVIDER,
      paddingVertical: verticalScale(14),
      paddingHorizontal: spacing[4],
    },
    stat: {
      flex: 1,
      alignItems: "center",
      gap: verticalScale(2),
      paddingHorizontal: spacing[4],
    },
    statValueRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      gap: spacing[2],
      maxWidth: "100%",
    },
    statValue: {
      color: colors.INK,
      flexShrink: 1,
    },
    statUnit: {
      color: colors.MUTED,
    },
    statLabel: {
      color: colors.MUTED,
      textAlign: "center",
    },
    statDivider: {
      width: 1,
      marginVertical: verticalScale(4),
      backgroundColor: colors.LINE,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.GROUND,
    },
  });
