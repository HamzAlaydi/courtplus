import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    description: {
      marginTop: verticalScale(18),
      color: colors.SLATE_GRAY,
      width: horizontalScale(240),
    },
    itemsContainer: {
      marginTop: verticalScale(23),
      gap: verticalScale(21.5),
    },
    button: {
      marginTop: verticalScale(23),
    },
  });
