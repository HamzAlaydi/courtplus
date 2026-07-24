import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(16),
      paddingStart: horizontalScale(17),
      paddingEnd: horizontalScale(14),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: horizontalScale(13.5),
    },
    iconContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(6),
    },
    text: {
      color: colors.SLATE_GRAY,
    },
    courtContainer: {
      marginTop: verticalScale(36),
      flexDirection: "row",
      justifyContent: "space-between",
    },
    courtInfoContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(8),
    },
    ratingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(4),
      marginEnd: horizontalScale(14),
      marginBottom: verticalScale(38),
    },
    friendsContainer: {
      marginTop: verticalScale(19),
      gap: verticalScale(10),
    },
    courtImage: {
      width: horizontalScale(127),
      height: verticalScale(68),
    },
    branchName: {
      color: colors.SLATE_GRAY,
      maxWidth: horizontalScale(109),
    },
    courtName: {
      color: colors.BLACK,
      maxWidth: horizontalScale(127),
    },
    branchContainer: {
      gap: verticalScale(13),
    },
    friendsText: {
      color: colors.GRAYISH_BLUE,
    },
    participantsContainer: {
      flexDirection: "row",
      gap: horizontalScale(10),
    },
    participantImage: {
      width: horizontalScale(32),
      height: verticalScale(32),
      borderRadius: horizontalScale(50),
    },
    rating: {
      color: colors.SLATE_GRAY,
    },
    friendIcon: {
      width: horizontalScale(32),
      height: verticalScale(32),
      borderRadius: horizontalScale(50),
    },
    button: {
      marginTop: verticalScale(16),
    },
  });
