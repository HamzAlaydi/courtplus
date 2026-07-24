import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingTop: verticalScale(40),
      flex: 1,
    },
    rowContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    gameContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[22],
    },
    gameChip: {
      width: horizontalScale(86),
      height: verticalScale(36),
      justifyContent: "center",
      alignItems: "center",
    },
    list: {
      backgroundColor: colors.WHITE,
      paddingStart: 0,
      marginTop: verticalScale(11.75),
    },
    memberContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    memberText: {
      marginStart: horizontalScale(16.03),
      marginEnd: horizontalScale(19.05),
    },
    switch: {
      marginEnd: horizontalScale(20.01),
    },
    info: {
      width: horizontalScale(16.03),
      height: verticalScale(16.03),
      tintColor: colors.SLATE_GRAY,
    },
    bottomContainer: {
      marginTop: verticalScale(26),
      flex: 1,
      justifyContent: "flex-end",
    },
    playersContainer: {
      marginTop: verticalScale(16),
      backgroundColor: `${colors.LIGHT_BLUE}82`,
      paddingHorizontal: horizontalScale(18),
      paddingTop: verticalScale(12),
    },
    margin: {
      marginTop: verticalScale(16),
    },
    listImage: {
      marginEnd: spacing[14],
    },
    description: {
      color: colors.SLATE_GRAY,
    },
    sports: {
      gap: horizontalScale(28),
    },
    sportsScroll: {
      marginStart: horizontalScale(48),
    },
    avatarSlots: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: verticalScale(9.23),
    },
    addPlayerTitle: {
      color: colors.SLATE_GRAY,
    },
    scrollContent: {
      paddingBottom: verticalScale(28),
    },
    courtImage: {
      width: horizontalScale(103.5),
      height: verticalScale(78.5),
      borderRadius: horizontalScale(8),
    },
    courtContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(13),
      marginTop: verticalScale(6.5),
    },
    courtInfoContainer: {
      gap: verticalScale(14.2),
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(8),
    },
    courtName: {
      width: horizontalScale(137),
    },
    timeIconContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(4),
    },
    timeIcon: {
      width: horizontalScale(11),
      height: horizontalScale(11),
      tintColor: colors.SLATE_GRAY,
    },
    addPlayersText: {
      marginTop: verticalScale(18),
      textDecorationLine: "underline",
      color: colors.MED_GREEN,
    },
  });
