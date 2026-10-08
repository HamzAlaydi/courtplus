import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    sheet: {
      paddingTop: verticalScale(16),
    },
    container: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing[8],
    },
    iconBadge: {
      width: horizontalScale(64),
      height: horizontalScale(64),
      borderRadius: Radius.pill,
      backgroundColor: colors.DANGER_BG,
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: horizontalScale(28),
      height: horizontalScale(28),
      resizeMode: "contain",
      tintColor: colors.DANGER,
    },
    title: {
      marginTop: verticalScale(16),
      textAlign: "center",
      color: colors.INK,
    },
    actions: {
      gap: verticalScale(10),
      marginTop: verticalScale(24),
    },
  });
