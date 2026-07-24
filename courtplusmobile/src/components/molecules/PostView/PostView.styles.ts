import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing[4],
      paddingBottom: verticalScale(4),
      paddingTop: verticalScale(16),
    },
    headerContainer: {
      paddingHorizontal: spacing[12],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: verticalScale(12),
    },
    imageBackground: {
      width: "100%",
      height: verticalScale(319),
      borderRadius: spacing[12],
      //   overflow: "hidden",
      justifyContent: "flex-end",
    },
    image: {
      borderRadius: spacing[8],
    },
    imageOverlay: {
      paddingHorizontal: spacing[12],
      paddingBottom: verticalScale(10),
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    likesCount: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      paddingHorizontal: spacing[6],
      borderRadius: spacing[18],
      backgroundColor: `${colors.BACKGROUND}80`,
      paddingVertical: verticalScale(3),
    },
    likeIcon: {
      width: spacing[10],
      height: verticalScale(9),
    },
    likeButton: {
      backgroundColor: `${colors.BACKGROUND}B2`,
      width: spacing[36],
      height: spacing[36],
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
    rightIcon: {
      tintColor: colors.WHITE,
    },
    body: {
      color: colors.BLACK,
      width: horizontalScale(200),
    },
    days: {
      color: colors.MED_GREY,
    },
    counts: {
      color: colors.WHITE,
      marginTop: isRTL ? verticalScale(4) : 0,
    },
  });
