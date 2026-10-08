import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      marginHorizontal: Layout.gutter,
      paddingTop: verticalScale(6),
      paddingBottom: verticalScale(16),
      paddingHorizontal: spacing[4],
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: colors.LINE,
      backgroundColor: colors.CARD,
      overflow: "hidden",
    },
  });
