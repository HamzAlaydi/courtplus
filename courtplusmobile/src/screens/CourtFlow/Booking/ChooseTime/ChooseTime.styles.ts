import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.GROUND,
    },
    scrollViewContent: {
      paddingBottom: verticalScale(220),
    },
    content: {
      marginTop: verticalScale(16),
      gap: Layout.sectionGap,
    },
    courtSummary: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      padding: spacing[12],
      borderRadius: Radius.tile,
      backgroundColor: colors.CARD,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    courtImage: {
      width: horizontalScale(52),
      height: horizontalScale(52),
      borderRadius: Radius.medium,
      backgroundColor: colors.DIVIDER,
    },
    courtInfo: {
      flex: 1,
      gap: verticalScale(2),
    },
    courtName: {
      color: colors.INK,
    },
    mutedText: {
      color: colors.MUTED,
    },
    rateRow: {
      alignItems: "flex-end",
    },
    rateValue: {
      color: colors.INK,
    },
    timezoneContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[8],
      marginTop: -verticalScale(8),
    },
    timezoneIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.MUTED,
      marginTop: verticalScale(1),
    },
    timezoneText: {
      flex: 1,
      color: colors.MUTED,
    },
    gapNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
      paddingVertical: verticalScale(10),
      paddingHorizontal: spacing[12],
      borderRadius: Radius.input,
      backgroundColor: colors.DANGER_BG,
    },
    gapNoticeDot: {
      width: horizontalScale(6),
      height: horizontalScale(6),
      borderRadius: Radius.pill,
      backgroundColor: colors.DANGER,
    },
    gapNoticeText: {
      flex: 1,
      color: colors.DANGER,
    },
  });
