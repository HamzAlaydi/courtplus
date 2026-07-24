import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    arrowIcon: {
      tintColor: colors.BLACK,
    },
    headerLeft: { width: horizontalScale(30) },
    closeButton: {
      width: horizontalScale(27),
      height: horizontalScale(27),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.GREEN_YELLOWISH,
      borderRadius: spacing[40],
    },
  });
