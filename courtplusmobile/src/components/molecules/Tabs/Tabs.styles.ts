import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    contentContainer: {
      borderBottomColor: colors.LIGHT_GREY,
      borderBottomWidth: 2,
      width: "100%",
      gap: spacing[44],
      paddingHorizontal: spacing[24],
    },
    title: {
      color: colors.GRAYISH_BLUE,
      marginBottom: verticalScale(4),
    },
    selectedTitle: {
      color: colors.BLACK,
    },
    activeBorder: {
      borderBottomColor: colors.GREEN_YELLOWISH,
      borderBottomWidth: 2,
    },
  });
