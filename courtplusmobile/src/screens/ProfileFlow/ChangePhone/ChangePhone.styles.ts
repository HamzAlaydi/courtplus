import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(16),
    },
    card: {
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      padding: spacing[16],
      paddingBottom: spacing[20],
      ...Shadows.card,
    },
    intro: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    iconBadge: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME_TINT,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    title: {
      flex: 1,
      color: colors.INK,
    },
    input: {
      marginTop: verticalScale(18),
    },
    button: {
      marginTop: verticalScale(20),
    },
  });
