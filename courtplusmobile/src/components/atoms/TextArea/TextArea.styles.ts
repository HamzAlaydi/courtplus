import { StyleSheet } from "react-native";
import { ColorsType, Radius, Typography } from "theme";
import { isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      marginTop: verticalScale(8),
      minHeight: verticalScale(96),
      paddingVertical: verticalScale(12),
      paddingHorizontal: spacing[14],
      backgroundColor: colors.CARD,
      borderRadius: Radius.input,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    focused: {
      borderColor: colors.INK,
    },
    label: {
      color: colors.MUTED,
    },
    counter: {
      color: colors.MUTED,
      textAlign: "right",
    },
    input: {
      minHeight: verticalScale(48),
      color: colors.INK,
      textAlign: isRTL ? "right" : "left",
      textAlignVertical: "top",
      ...Typography.headline3.regular,
      padding: 0,
    },
    counterContainer: {
      flex: 1,
      justifyContent: "flex-end",
      marginTop: verticalScale(6),
    },
  });
