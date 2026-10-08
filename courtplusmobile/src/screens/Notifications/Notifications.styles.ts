import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    emptyImage: {
      width: horizontalScale(72),
      height: horizontalScale(80),
      resizeMode: "contain",
      tintColor: colors.FAINT,
    },
    loader: {
      backgroundColor: "transparent",
      paddingHorizontal: 0,
    },
    listContainer: {
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(24),
    },
    separator: {
      height: verticalScale(10),
    },
    container: {
      paddingBottom: 0,
    },
  });
