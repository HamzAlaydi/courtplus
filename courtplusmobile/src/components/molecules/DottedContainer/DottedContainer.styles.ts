import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: verticalScale(11.71),
      paddingBottom: verticalScale(4),
      paddingHorizontal: horizontalScale(11),
      borderRadius: spacing[12],
      borderWidth: 1,
      borderColor: colors.MED_GREY,
      borderStyle: "dashed",
    },
  });
