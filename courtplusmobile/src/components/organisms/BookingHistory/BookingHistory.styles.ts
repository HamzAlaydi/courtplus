import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loader: {
      backgroundColor: colors.LIGHT_GREY,
    },
    contentContainer: {
      paddingHorizontal: spacing[2],
      paddingBottom: verticalScale(40),
    },
    separator: {
      marginTop: verticalScale(10),
    },
  });
