import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    calendarCard: {
      marginTop: verticalScale(20),
      paddingHorizontal: spacing[8],
      paddingVertical: verticalScale(12),
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      ...Shadows.card,
    },
  });
