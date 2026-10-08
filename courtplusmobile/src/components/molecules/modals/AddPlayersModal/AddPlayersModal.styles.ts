import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Typography } from "theme";
import {
  horizontalScale,
  isAndroid,
  isRTL,
  spacing,
  verticalScale,
} from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    slotsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: verticalScale(16),
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
      minHeight: Layout.fieldHeight,
      paddingHorizontal: spacing[14],
      marginTop: verticalScale(18),
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.input,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    searchIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    input: {
      ...Typography.headline3.medium,
      flex: 1,
      color: colors.INK,
      textAlign: isRTL ? "right" : "left",
      paddingVertical: verticalScale(isAndroid ? 6 : 12),
      lineHeight: undefined,
    },
    button: {
      flex: 1,
      justifyContent: "flex-end",
      marginTop: verticalScale(20),
    },
  });
