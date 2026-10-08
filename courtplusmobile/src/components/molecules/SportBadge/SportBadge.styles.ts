import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    sportContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
      paddingVertical: verticalScale(8),
      paddingStart: spacing[8],
      paddingEnd: spacing[14],
      borderRadius: Radius.input,
    },
    iconContainer: {
      width: horizontalScale(34),
      height: horizontalScale(34),
      borderRadius: horizontalScale(17),
      backgroundColor: colors.LIME_TINT,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    title: {
      color: colors.INK,
    },
    subtitle: {
      color: colors.MUTED,
    },
  });
