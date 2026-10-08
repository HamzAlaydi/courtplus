import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
    },
    header: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(8),
      gap: verticalScale(14),
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    titleColumn: {
      flex: 1,
      alignItems: "flex-start",
      gap: verticalScale(2),
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      maxWidth: "100%",
      minHeight: verticalScale(22),
    },
    locationIcon: {
      width: horizontalScale(11),
      height: horizontalScale(13),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    locationText: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    locationChevron: {
      width: horizontalScale(10),
      height: horizontalScale(10),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    locationLoader: {
      alignSelf: "flex-start",
      minHeight: verticalScale(22),
    },
    roundButton: {
      width: Layout.touch,
      height: Layout.touch,
      borderRadius: Radius.pill,
      backgroundColor: colors.CARD,
      alignItems: "center",
      justifyContent: "center",
      ...Shadows.subtle,
    },
    roundButtonIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
    },
    searchField: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
      height: Layout.fieldHeight,
      paddingHorizontal: spacing[14],
      borderRadius: Radius.input,
      backgroundColor: colors.CARD,
      ...Shadows.subtle,
    },
    searchIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    searchPlaceholder: {
      flex: 1,
      color: colors.MUTED,
    },
    filterButton: {
      width: Layout.fieldHeight,
      height: Layout.fieldHeight,
      borderRadius: Radius.input,
      backgroundColor: colors.INK,
      alignItems: "center",
      justifyContent: "center",
    },
    filterIcon: {
      width: horizontalScale(19),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.WHITE,
    },
    filterBadge: {
      position: "absolute",
      top: -horizontalScale(5),
      end: -horizontalScale(5),
      minWidth: horizontalScale(20),
      height: horizontalScale(20),
      paddingHorizontal: spacing[4],
      borderRadius: Radius.pill,
      borderWidth: 2,
      borderColor: colors.GROUND,
      backgroundColor: colors.LIME,
      alignItems: "center",
      justifyContent: "center",
    },
    filterBadgeText: {
      color: colors.INK,
      lineHeight: moderateScale(13),
    },
    sportChips: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(14),
    },
    activeFiltersScroll: {
      flexGrow: 0,
    },
    activeFilters: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(10),
      gap: spacing[8],
    },
    activeFilterChip: {
      minHeight: verticalScale(34),
      paddingStart: spacing[12],
      paddingEnd: spacing[10],
      borderColor: colors.LIME_TINT_BORDER,
    },
    activeFilterIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    activeFilterStar: {
      tintColor: colors.STAR,
    },
    removeFilterButton: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      alignItems: "center",
      justifyContent: "center",
    },
    removeFilterIcon: {
      width: horizontalScale(10),
      height: horizontalScale(10),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    resultsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(10),
      minHeight: verticalScale(42),
    },
    resultsText: {
      flexShrink: 1,
      color: colors.MUTED,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
    sortButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      minHeight: verticalScale(32),
      maxWidth: "60%",
    },
    sortText: {
      flexShrink: 1,
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
    sortChevron: {
      width: horizontalScale(11),
      height: horizontalScale(11),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    courtsList: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(6),
      paddingBottom: verticalScale(28),
    },
    courtSeparator: {
      height: verticalScale(14),
    },
  });
