import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: verticalScale(35),
    },
    content: {
      paddingTop: verticalScale(16),
      gap: verticalScale(14),
    },
    restoreContainer: {
      width: Layout.touch,
      height: Layout.touch,
      borderRadius: Layout.touch / 2,
      backgroundColor: colors.CARD,
      justifyContent: "center",
      alignItems: "center",
      ...Shadows.subtle,
    },
    restoreIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    courtCard: {
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      borderRadius: Radius.cardLarge,
      ...Shadows.raised,
    },
    courtImage: {
      height: verticalScale(176),
      borderTopLeftRadius: Radius.cardLarge,
      borderTopRightRadius: Radius.cardLarge,
      overflow: "hidden",
      backgroundColor: colors.DIVIDER,
    },
    courtImageInner: {
      borderTopLeftRadius: Radius.cardLarge,
      borderTopRightRadius: Radius.cardLarge,
    },
    imageBadges: {
      position: "absolute",
      top: spacing[12],
      start: spacing[12],
      end: spacing[12],
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
      paddingHorizontal: spacing[10],
      paddingVertical: verticalScale(4),
    },
    ratingBadgeIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.LIME,
    },
    ratingBadgeText: {
      color: colors.WHITE,
    },
    courtInfoContainer: {
      paddingHorizontal: spacing[16],
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(16),
      gap: verticalScale(8),
    },
    metaContainer: {
      gap: verticalScale(4),
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
    },
    metaIcon: {
      width: horizontalScale(13),
      height: horizontalScale(13),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    metaText: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[6],
      marginTop: verticalScale(2),
    },
    whenCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      paddingHorizontal: spacing[12],
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(12),
    },
    dateBlock: {
      width: horizontalScale(56),
      height: horizontalScale(60),
      borderRadius: Radius.input,
      backgroundColor: colors.INK,
      alignItems: "center",
      justifyContent: "center",
    },
    dateBlockMonth: {
      color: colors.LIME,
    },
    dateBlockDay: {
      color: colors.WHITE,
    },
    whenItem: {
      flex: 1,
      gap: verticalScale(4),
    },
    whenLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    whenIcon: {
      width: horizontalScale(13),
      height: horizontalScale(13),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    verticalDivider: {
      width: 1,
      alignSelf: "stretch",
      marginVertical: verticalScale(6),
      backgroundColor: colors.DIVIDER,
    },
    card: {
      paddingHorizontal: spacing[16],
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(16),
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardHeaderText: {
      color: colors.MUTED,
    },
    countBadge: {
      minWidth: horizontalScale(28),
      height: horizontalScale(28),
      paddingHorizontal: spacing[8],
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    participantsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      paddingVertical: verticalScale(12),
    },
    participantDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.DIVIDER,
    },
    playerImage: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: horizontalScale(22),
      backgroundColor: colors.DIVIDER,
    },
    playerInfoContainer: {
      flex: 1,
      gap: verticalScale(2),
    },
    mutedText: {
      color: colors.MUTED,
    },
    courtCostContainer: {
      marginTop: verticalScale(14),
    },
    divider: {
      height: 1,
      backgroundColor: colors.DIVIDER,
      marginVertical: verticalScale(14),
    },
    totalContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    paymentStatusContainer: {
      marginTop: verticalScale(14),
      paddingVertical: verticalScale(10),
      paddingHorizontal: spacing[12],
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.input,
      borderWidth: 1,
      borderColor: colors.DIVIDER,
    },
    actionsContainer: {
      marginTop: verticalScale(6),
      gap: verticalScale(10),
    },
    cancelClosed: {
      color: colors.MUTED,
      textAlign: "center",
    },
  });
