import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, moderateScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(10),
    },
    dot: {
      width: horizontalScale(4),
      height: horizontalScale(4),
      borderRadius: horizontalScale(2),
      backgroundColor: colors.HANDLE,
    },
    text: {
      color: colors.INK,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(18),
    },
  });
