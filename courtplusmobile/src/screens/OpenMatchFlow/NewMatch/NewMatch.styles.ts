import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingTop: verticalScale(18),
      gap: verticalScale(18),
      flex: 1,
    },
    section: {
      gap: verticalScale(10),
    },
    sports: {
      gap: spacing[8],
      paddingHorizontal: Layout.gutter,
    },
    sportsScroll: {
      marginHorizontal: -Layout.gutter,
      flexGrow: 0,
    },
    gameContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[8],
    },
    playersContainer: {
      paddingHorizontal: spacing[16],
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(16),
      borderRadius: Radius.card,
      gap: verticalScale(10),
    },
    addPlayerTitle: {
      color: colors.MUTED,
    },
    avatarSlots: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    addPlayersButton: {
      alignSelf: "flex-start",
      marginTop: verticalScale(2),
    },
    addPlayersIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    listImage: {
      tintColor: colors.INK,
    },
    description: {
      color: colors.MUTED,
    },
    memberContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
      minHeight: verticalScale(64),
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(10),
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    memberIconTile: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: Radius.medium,
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    memberIcon: {
      width: horizontalScale(16),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    memberText: {
      flex: 1,
      color: colors.INK,
    },
    info: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    bottomContainer: {
      marginTop: verticalScale(8),
      flex: 1,
      justifyContent: "flex-end",
    },
    scrollContent: {
      paddingBottom: verticalScale(28),
    },
    courtImage: {
      width: horizontalScale(64),
      height: horizontalScale(52),
      borderRadius: Radius.medium,
      backgroundColor: colors.DIVIDER,
    },
    courtContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      marginTop: verticalScale(6),
    },
    courtInfoContainer: {
      flex: 1,
      gap: verticalScale(4),
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing[8],
    },
    courtName: {
      color: colors.INK,
    },
    timeIconContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    timeIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
  });
