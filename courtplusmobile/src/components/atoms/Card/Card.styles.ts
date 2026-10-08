import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.CARD,
      paddingHorizontal: spacing[6],
      paddingTop: verticalScale(11),
      paddingBottom: verticalScale(11),
      borderRadius: Radius.card,
      ...Shadows.card,
    },
  });
