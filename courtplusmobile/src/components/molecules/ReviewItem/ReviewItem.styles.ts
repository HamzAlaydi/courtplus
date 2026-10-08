import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      paddingHorizontal: spacing[14],
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(16),
      gap: verticalScale(10),
      ...Shadows.card,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
    },
    userInfo: {
      flex: 1,
    },
    image: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: Radius.pill,
      backgroundColor: colors.DIVIDER,
    },
    username: {
      color: colors.MUTED,
    },
    date: {
      color: colors.MUTED,
      maxWidth: "35%",
    },
    starsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    star: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.STAR,
    },
    emptyStar: {
      tintColor: colors.HANDLE,
    },
    comment: {
      color: colors.INK,
    },
  });
