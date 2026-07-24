import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.LIGHT_GREY,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
      paddingEnd: spacing[12],
      paddingStart: spacing[2],
      paddingVertical: verticalScale(2),
      borderRadius: spacing[40],
    },
    selected: {
      backgroundColor: colors.GREEN_YELLOWISH,
    },
    title: {
      color: colors.BLACK,
    },
  });
