import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    card: {
      paddingVertical: verticalScale(18),
      paddingHorizontal: horizontalScale(16),
    },
    content: {
      paddingTop: verticalScale(28),
      gap: verticalScale(6),
    },
    divider: {
      height: 1,
      borderColor: colors.LIGHT_GREY,
      marginVertical: verticalScale(12),
      borderStyle: "dashed",
      borderWidth: 1,
    },
    totalContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: verticalScale(7.5),
    },
    total: {
      color: colors.GREY,
    },
    amount: {
      fontSize: moderateScale(24),
    },
    courtCostContainer: {
      marginTop: verticalScale(12),
    },
    courtCostText: {
      color: colors.GREY,
    },
    paymentStatusContainer: {
      marginTop: verticalScale(12),
      paddingVertical: verticalScale(16),
      paddingHorizontal: horizontalScale(20),
      backgroundColor: `${colors.BUTTON_GREEN}0A`,
      borderRadius: spacing[12],
    },
    paymentStatusText: {
      color: colors.BUTTON_GREEN,
    },
    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateItem: {
      gap: verticalScale(6),
    },
    dateIconContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
    },
    dateIcon: {
      width: spacing[16],
      height: spacing[16],
      tintColor: colors.GREY,
    },
    paymentInfoText: {
      color: colors.GREY,
    },
    branchContainer: {
      gap: spacing[4],
      flexDirection: "row",
      alignItems: "center",
      marginTop: verticalScale(4),
      marginBottom: verticalScale(2),
    },
    distanceContainer: {
      gap: spacing[4],
      flexDirection: "row",
      alignItems: "center",
    },
    ratingContainer: {
      gap: spacing[4],
      flexDirection: "row",
      alignItems: "center",
      marginTop: verticalScale(12),
    },
    courtImage: {
      width: horizontalScale(319),
      height: verticalScale(255),
      borderRadius: spacing[8],
    },
    courtInfoContainer: {
      paddingHorizontal: spacing[12],
      paddingTop: verticalScale(28),
      paddingBottom: verticalScale(16),
    },
    courtCard: {
      paddingTop: 0,
      paddingVertical: verticalScale(4),
      paddingHorizontal: horizontalScale(4),
      paddingBottom: 0,
    },
    scrollContent: {
      paddingBottom: verticalScale(35),
    },
    location: {
      color: colors.GRAYISH_BLUE,
    },
    rating: {
      color: colors.SLATE_GRAY,
    },
    branchName: {
      color: colors.SLATE_GRAY,
    },
    date: {
      color: colors.SLATE_GRAY,
    },
    restoreContainer: {
      backgroundColor: colors.GHOST_WHITE,
      justifyContent: "center",
      alignItems: "center",
      width: spacing[40],
      height: spacing[40],
      borderRadius: spacing[40],
    },
    playersJoined: {
      color: colors.GREY,
      marginBottom: verticalScale(12),
    },
    header: {
      justifyContent: "space-between",
      alignItems: "center",
    },
    playerImage: {
      width: spacing[40],
      height: spacing[40],
      borderRadius: spacing[40],
    },
    participantsContainer: {
      marginBottom: verticalScale(18),
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    playerName: {
      color: colors.BLACK,
    },
    playerUsername: {
      color: colors.GREY,
    },
    playerInfoContainer: {
      gap: verticalScale(4),
    },
  });
