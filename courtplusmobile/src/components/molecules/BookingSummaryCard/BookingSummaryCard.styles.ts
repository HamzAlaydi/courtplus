import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

const FRIEND_SIZE = horizontalScale(28);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing[12],
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(12),
      gap: verticalScale(12),
    },
    ticket: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: spacing[12],
    },
    dateBlock: {
      width: horizontalScale(58),
      minHeight: horizontalScale(72),
      paddingVertical: verticalScale(8),
      paddingHorizontal: spacing[4],
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
    info: {
      flex: 1,
      gap: verticalScale(3),
      justifyContent: "center",
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[8],
    },
    sportRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    sportIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    statusPill: {
      flexShrink: 0,
    },
    courtName: {
      color: colors.INK,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    timeIcon: {
      width: horizontalScale(13),
      height: horizontalScale(13),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    timeText: {
      color: colors.INK,
      flexShrink: 1,
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
    mutedText: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      paddingTop: verticalScale(10),
      borderTopWidth: 1,
      borderTopColor: colors.DIVIDER,
    },
    friends: {
      flexShrink: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    avatars: {
      flexDirection: "row",
      alignItems: "center",
    },
    friendIcon: {
      width: FRIEND_SIZE,
      height: FRIEND_SIZE,
      borderRadius: FRIEND_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.CARD,
      backgroundColor: colors.DIVIDER,
    },
    friendOverlap: {
      marginStart: -spacing[8],
    },
    moreFriends: {
      backgroundColor: colors.INK,
      alignItems: "center",
      justifyContent: "center",
    },
    moreFriendsText: {
      color: colors.WHITE,
      fontSize: moderateScale(10),
      lineHeight: moderateScale(13),
    },
    ratingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      paddingHorizontal: spacing[8],
      paddingVertical: verticalScale(3),
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
    },
    starIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.STAR,
    },
    rating: {
      color: colors.INK,
    },
    button: {
      marginTop: verticalScale(2),
    },
    buttonIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
  });
