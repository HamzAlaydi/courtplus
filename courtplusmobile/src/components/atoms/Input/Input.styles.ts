import { StyleSheet } from "react-native";
import { ColorsType, Radius, Typography } from "theme";
import { isAndroid, isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.CARD,
      borderRadius: Radius.input,
      borderWidth: 1,
      borderColor: colors.LINE,
      minHeight: verticalScale(50),
      paddingHorizontal: spacing[14],
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
    },
    focused: {
      borderColor: colors.INK,
    },
    input: {
      ...Typography.headline3.medium,
      flex: 1,
      color: colors.INK,
      textAlign: isRTL ? "right" : "left",
      paddingVertical: verticalScale(isAndroid ? 6 : 12),
      lineHeight: undefined,
    },
  });
