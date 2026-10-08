import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      minHeight: horizontalScale(44),
      paddingBottom: verticalScale(4),
    },
    topSpacing: {
      height: verticalScale(8),
    },
    titleContainer: {
      flex: 1,
      justifyContent: "center",
    },
    title: {
      color: colors.INK,
    },
  });
