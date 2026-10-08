import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing[12],
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(10),
      marginBottom: verticalScale(14),
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
      paddingHorizontal: spacing[2],
    },
    avatar: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: Radius.pill,
      backgroundColor: colors.DIVIDER,
    },
    headerText: {
      flex: 1,
    },
    name: {
      color: colors.INK,
    },
    days: {
      color: colors.MUTED,
    },
    body: {
      color: colors.INK,
      marginTop: verticalScale(10),
      paddingHorizontal: spacing[2],
    },
    image: {
      width: "100%",
      height: verticalScale(300),
      borderRadius: Radius.tile,
      marginTop: verticalScale(12),
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
      marginTop: verticalScale(10),
    },
    likeButton: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
      justifyContent: "center",
      alignItems: "center",
    },
    likeButtonActive: {
      backgroundColor: colors.LIME,
    },
    likeIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    counts: {
      color: colors.INK,
    },
  });
