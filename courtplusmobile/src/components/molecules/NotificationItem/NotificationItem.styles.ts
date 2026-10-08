import { StyleSheet } from "react-native";
import { ColorsType, Radius, Typography } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      paddingVertical: verticalScale(12),
      paddingHorizontal: spacing[12],
      backgroundColor: colors.CARD,
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    avatar: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: Radius.pill,
      backgroundColor: colors.DIVIDER,
    },
    iconTile: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME_TINT,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    body: {
      flex: 1,
      gap: verticalScale(2),
    },
    content: {
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(19),
    },
    time: {
      color: colors.MUTED,
    },
    button: {
      paddingVertical: verticalScale(4),
      paddingHorizontal: spacing[14],
    },
    buttonText: {
      ...Typography.caption.semiBold,
    },
  });
