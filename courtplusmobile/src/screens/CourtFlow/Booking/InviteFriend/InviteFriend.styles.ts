import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(16),
      gap: verticalScale(16),
    },
    title: {
      color: colors.INK,
    },
    slotsContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-around",
      paddingVertical: verticalScale(16),
      paddingHorizontal: spacing[8],
      borderRadius: Radius.card,
      backgroundColor: colors.CARD,
      ...Shadows.card,
    },
    searchGroup: {
      gap: verticalScale(8),
    },
    searchIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    description: {
      color: colors.MUTED,
      paddingHorizontal: spacing[4],
    },
    separator: {
      height: verticalScale(8),
    },
    listContent: {
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(140),
    },
    profileCard: {
      marginTop: 0,
    },
  });
