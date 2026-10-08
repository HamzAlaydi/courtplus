import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.DEEP,
      minHeight: verticalScale(56),
      paddingHorizontal: spacing[20],
      paddingVertical: verticalScale(10),
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.ON_INK_LINE,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[14],
    },
    title: {
      color: colors.WHITE,
    },
    selected: {
      backgroundColor: colors.LIME,
      borderColor: colors.LIME,
    },
    selectedTitle: {
      color: colors.INK,
    },
    image: {
      width: spacing[28],
      height: verticalScale(18.85),
      borderRadius: spacing[4],
    },
  });
