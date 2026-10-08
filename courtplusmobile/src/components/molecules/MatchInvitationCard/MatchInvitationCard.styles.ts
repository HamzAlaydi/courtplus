import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const AVATAR_SIZE = horizontalScale(32);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      paddingHorizontal: spacing[14],
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(14),
      gap: verticalScale(12),
      ...Shadows.card,
    },
    invitation: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
    },
    creatorAvatar: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: horizontalScale(18),
      backgroundColor: colors.DIVIDER,
    },
    invitationText: {
      flex: 1,
    },
    description: {
      color: colors.MUTED,
    },
    ticket: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      padding: spacing[10],
      borderRadius: Radius.tile,
      backgroundColor: colors.SUBTLE,
      borderWidth: 1,
      borderColor: colors.DIVIDER,
    },
    dateBlock: {
      width: horizontalScale(58),
      paddingVertical: verticalScale(8),
      borderRadius: Radius.input,
      backgroundColor: colors.INK,
      alignItems: "center",
      justifyContent: "center",
    },
    dateBlockDay: {
      color: colors.LIME,
    },
    dateBlockNumber: {
      color: colors.WHITE,
    },
    dateBlockMonth: {
      color: colors.ON_INK_MUTED,
    },
    ticketInfo: {
      flex: 1,
      gap: verticalScale(3),
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    metaIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    metaText: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
    },
    players: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 1,
    },
    playerAvatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.CARD,
      backgroundColor: colors.DIVIDER,
    },
    playerOverlap: {
      marginStart: -spacing[8],
    },
    morePlayers: {
      backgroundColor: colors.INK,
      alignItems: "center",
      justifyContent: "center",
    },
    morePlayersText: {
      color: colors.WHITE,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing[4],
    },
    buttonsRow: {
      marginTop: verticalScale(2),
    },
  });
