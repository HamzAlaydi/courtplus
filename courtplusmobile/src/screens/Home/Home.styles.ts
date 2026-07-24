import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.WHITE,
    },
    content: {
      paddingHorizontal: 0,
      paddingBottom: verticalScale(24),
    },
    courtsSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: verticalScale(24),
      paddingBottom: verticalScale(12),
      paddingHorizontal: spacing[24],
    },
    input: {
      marginTop: verticalScale(20),
      marginHorizontal: spacing[24],
    },
    bottomContainer: {
      paddingTop: verticalScale(37),
      paddingHorizontal: spacing[24],
    },
    actionCardImage: {
      width: horizontalScale(150),
      height: verticalScale(82),
      justifyContent: "flex-end",
      paddingBottom: verticalScale(6),
    },
    actionCard: {
      paddingTop: verticalScale(2),
      paddingBottom: verticalScale(8),
    },
    actionCardDescription: {
      width: horizontalScale(142),
      marginTop: verticalScale(18),
      marginStart: horizontalScale(7),
      color: colors.SLATE_GRAY,
    },
    actionCardTitle: {
      color: colors.WHITE,
    },
    actionCardImageBg: {
      borderRadius: horizontalScale(9),
    },
    actionCardImageContainer: {
      flexDirection: "row",
      gap: horizontalScale(8),
      alignItems: "center",
      paddingHorizontal: horizontalScale(7),
    },
    actionCardsRow: {
      flexDirection: "row",
      gap: horizontalScale(17),
      marginTop: verticalScale(13),
    },
    locationHeader: {
      paddingHorizontal: spacing[24],
    },
    sportChips: {
      paddingHorizontal: spacing[24],
      paddingTop: verticalScale(12),
    },
    courtScrollView: {
      flexGrow: 1,
      paddingBottom: verticalScale(6),
      paddingTop: verticalScale(18),
      paddingHorizontal: spacing[24],
    },
    courtSeparator: {
      width: horizontalScale(22),
    },
    seeAll: {
      color: colors.GRAYISH_BLUE,
    },
    courtsTitle: {
      color: colors.SLATE_GRAY,
    },
  });
