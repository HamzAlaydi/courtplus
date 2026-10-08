import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[6],
      minHeight: verticalScale(40),
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(6),
      backgroundColor: colors.CARD,
      borderColor: colors.LINE,
      borderWidth: 1,
      borderRadius: Radius.pill,
      maxWidth: horizontalScale(140),
      ...Shadows.subtle,
    },
    icon: {
      width: spacing[16],
      height: spacing[16],
      resizeMode: "contain",
    },
    title: {
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
      flexShrink: 1,
    },
  });
