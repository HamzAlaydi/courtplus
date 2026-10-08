import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    week: {
      flexDirection: "row",
      gap: horizontalScale(6),
    },
    title: {
      color: colors.INK,
      marginBottom: verticalScale(12),
    },
    listContainer: {
      minHeight: verticalScale(64),
    },
  });
