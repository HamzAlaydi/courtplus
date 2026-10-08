import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(6),
      paddingHorizontal: horizontalScale(12),
      borderRadius: Radius.input,
      borderWidth: 1.5,
      borderColor: colors.HANDLE,
      borderStyle: "dashed",
    },
  });
