import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: colors.CARD,
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.LINE,
      paddingVertical: verticalScale(14),
      paddingHorizontal: spacing[4],
    },
    column: {
      flex: 1,
      alignItems: "flex-start",
      gap: verticalScale(6),
      paddingHorizontal: spacing[10],
    },
    iconContainer: {
      width: horizontalScale(32),
      height: horizontalScale(32),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME_TINT,
      alignItems: "center",
      justifyContent: "center",
    },
    image: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    title: {
      color: colors.INK,
      fontSize: moderateScale(16),
      lineHeight: moderateScale(22),
    },
    subtitle: {
      color: colors.MUTED,
    },
    divider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: colors.DIVIDER,
    },
    dividerBlack: {
      backgroundColor: colors.LINE,
    },
  });
