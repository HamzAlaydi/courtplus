import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      padding: spacing[10],
      paddingEnd: spacing[12],
      backgroundColor: colors.CARD,
      borderRadius: Radius.tile,
      ...Shadows.card,
    },
    profileContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    textContainer: {
      flex: 1,
      gap: verticalScale(2),
    },
    username: {
      color: colors.MUTED,
    },
    image: {
      width: horizontalScale(48),
      height: horizontalScale(48),
      borderRadius: Radius.pill,
      backgroundColor: colors.DIVIDER,
    },
    button: {
      minHeight: verticalScale(38),
      paddingHorizontal: spacing[16],
    },
    buttonText: {
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
  });
