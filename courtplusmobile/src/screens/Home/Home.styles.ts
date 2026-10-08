import { Dimensions, StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

const { width: windowWidth } = Dimensions.get("window");

/** Matches the HomeCourt card so the loading skeleton has the same shape. */
export const COURT_CARD_WIDTH = horizontalScale(252);
export const COURT_IMAGE_HEIGHT = verticalScale(132);
export const COURT_GAP = spacing[12];

export default (colors: ColorsType) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.GROUND,
    },
    statusBarBackdrop: {
      backgroundColor: colors.INK,
    },
    content: {
      paddingHorizontal: 0,
      paddingBottom: verticalScale(28),
    },
    headerBand: {
      backgroundColor: colors.INK,
      borderBottomLeftRadius: Radius.sheet,
      borderBottomRightRadius: Radius.sheet,
      paddingTop: verticalScale(10),
      paddingHorizontal: spacing[20],
      paddingBottom: verticalScale(22),
      gap: verticalScale(18),
    },
    avatar: {
      width: Layout.touch,
      height: Layout.touch,
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    avatarInitials: {
      color: colors.INK,
      textAlign: "center",
    },
    avatarIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    greeting: {
      gap: verticalScale(6),
    },
    greetingTitle: {
      color: colors.WHITE,
    },
    greetingSubtitle: {
      color: colors.ON_INK_MUTED,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
    },
    input: {
      flex: 1,
      minHeight: Layout.fieldHeight,
      borderColor: "transparent",
    },
    filterButton: {
      width: Layout.fieldHeight,
      height: Layout.fieldHeight,
      borderRadius: Radius.input,
      backgroundColor: colors.LIME,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActions: {
      flexDirection: "row",
      gap: spacing[8],
      paddingTop: verticalScale(20),
      paddingHorizontal: Layout.gutter,
    },
    quickActionCell: {
      flex: 1,
    },
    quickAction: {
      alignItems: "center",
      gap: verticalScale(8),
    },
    quickActionTile: {
      width: horizontalScale(56),
      height: horizontalScale(56),
      borderRadius: Radius.tile,
      backgroundColor: colors.CARD,
      alignItems: "center",
      justifyContent: "center",
      ...Shadows.card,
    },
    quickActionLabel: {
      textAlign: "center",
      color: colors.INK,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing[12],
      paddingTop: Layout.sectionGap,
      paddingHorizontal: Layout.gutter,
    },
    sectionTitle: {
      flexShrink: 1,
      color: colors.INK,
    },
    seeAll: {
      fontSize: moderateScale(13),
      color: colors.DEEP,
    },
    sportChips: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(12),
    },
    courtScrollView: {
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(18),
      paddingHorizontal: Layout.gutter,
    },
    courtSeparator: {
      width: COURT_GAP,
    },
    skeletonRow: {
      flexDirection: "row",
      overflow: "hidden",
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(18),
      paddingHorizontal: Layout.gutter,
    },
    emptyState: {
      width: windowWidth - Layout.gutter * 2,
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: colors.LINE,
      paddingVertical: verticalScale(24),
    },
    emptyImage: {
      width: horizontalScale(88),
      height: horizontalScale(88),
      marginBottom: verticalScale(12),
    },
  });
