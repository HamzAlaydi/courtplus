import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

const SHEET_PADDING = spacing[20];

export default (colors: ColorsType) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.INK,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Layout.gutter,
      paddingBottom: verticalScale(14),
    },
    sheet: {
      flex: 1,
      backgroundColor: colors.CARD,
      borderTopStartRadius: Radius.sheet,
      borderTopEndRadius: Radius.sheet,
      overflow: "hidden",
    },
    handle: {
      alignSelf: "center",
      width: horizontalScale(40),
      height: verticalScale(5),
      borderRadius: Radius.pill,
      backgroundColor: colors.HANDLE,
      marginTop: verticalScale(10),
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      paddingHorizontal: SHEET_PADDING,
      paddingTop: verticalScale(12),
    },
    sheetTitle: {
      flexShrink: 1,
    },
    clearButton: {
      minHeight: Layout.touch,
      justifyContent: "center",
    },
    clearText: {
      color: colors.MUTED,
    },
    content: {
      paddingHorizontal: SHEET_PADDING,
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(28),
      gap: Layout.sectionGap,
    },
    section: {
      gap: verticalScale(12),
    },
    chipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[8],
    },
    chipText: {
      fontSize: moderateScale(14),
      lineHeight: moderateScale(20),
    },
    sportChip: {
      minHeight: verticalScale(42),
      paddingEnd: spacing[16],
    },
    sportIconContainer: {
      width: horizontalScale(32),
      height: horizontalScale(32),
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedSportIconContainer: {
      backgroundColor: colors.LIME,
    },
    sportIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    ratingRow: {
      flexDirection: "row",
      gap: spacing[8],
    },
    ratingChip: {
      flex: 1,
      justifyContent: "center",
      minHeight: verticalScale(42),
      borderRadius: Radius.medium,
      paddingStart: spacing[8],
      paddingEnd: spacing[8],
      gap: spacing[4],
    },
    selectedRatingChip: {
      backgroundColor: colors.WARNING_BG,
      borderColor: colors.STAR,
    },
    ratingText: {
      color: colors.INK,
    },
    ratingStar: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.STAR,
    },
    toggleGroup: {
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.tile,
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(4),
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      minHeight: verticalScale(68),
      paddingVertical: verticalScale(10),
    },
    toggleDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.LINE,
    },
    toggleIconTile: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: Radius.medium,
      backgroundColor: colors.CARD,
      alignItems: "center",
      justifyContent: "center",
    },
    toggleIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    toggleTextContainer: {
      flex: 1,
      gap: verticalScale(2),
    },
    toggleLabel: {
      fontSize: moderateScale(15),
      lineHeight: moderateScale(21),
    },
    toggleHint: {
      color: colors.MUTED,
    },
    availability: {
      gap: Layout.sectionGap,
    },
    periodGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[8],
    },
    periodTile: {
      flexGrow: 1,
      flexBasis: "45%",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
      minHeight: verticalScale(60),
      paddingHorizontal: spacing[10],
      paddingVertical: verticalScale(10),
      borderRadius: Radius.input,
      borderWidth: 1,
      borderColor: colors.LINE,
      backgroundColor: colors.CARD,
    },
    selectedPeriodTile: {
      backgroundColor: colors.INK,
      borderColor: colors.INK,
    },
    periodIconContainer: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedPeriodIconContainer: {
      backgroundColor: colors.LIME,
    },
    periodIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    periodTextContainer: {
      flex: 1,
    },
    periodName: {
      color: colors.INK,
    },
    selectedPeriodName: {
      color: colors.WHITE,
    },
    periodTime: {
      color: colors.MUTED,
    },
    selectedPeriodTime: {
      color: colors.ON_INK_MUTED,
    },
    durationGrid: {
      flexDirection: "row",
      gap: spacing[8],
    },
    durationOption: {
      flex: 1,
      minHeight: Layout.touch,
      borderRadius: Radius.medium,
      borderWidth: 1,
      borderColor: colors.LINE,
      backgroundColor: colors.CARD,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing[6],
    },
    selectedDurationOption: {
      backgroundColor: colors.INK,
      borderColor: colors.INK,
    },
    durationText: {
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
    selectedDurationText: {
      color: colors.WHITE,
    },
    footer: {
      paddingHorizontal: SHEET_PADDING,
      paddingTop: verticalScale(14),
      backgroundColor: colors.CARD,
      borderTopWidth: 1,
      borderTopColor: colors.DIVIDER,
    },
  });
