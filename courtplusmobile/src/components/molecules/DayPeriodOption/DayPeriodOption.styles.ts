import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.LIGHT_GREY,
      borderRadius: spacing[12],
      justifyContent: "center",
      alignItems: "center",
      width: horizontalScale(127),
    },
    image: {
      marginTop: verticalScale(30),
    },
    title: {
      marginTop: verticalScale(12),
    },
    selectedContainer: {
      backgroundColor: colors.GREEN_YELLOWISH,
    },
    itemDescription: {
      marginTop: verticalScale(14.92),
      marginBottom: verticalScale(20),
      color: colors.SLATE_GRAY,
    },
    selectedItemDescription: {
      color: colors.BUTTON_GREEN,
    },
  });
