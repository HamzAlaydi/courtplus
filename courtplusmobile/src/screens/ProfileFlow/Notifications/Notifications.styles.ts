import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    listActionItem: {
      marginTop: verticalScale(18),
    },
    icon: {
      tintColor: colors.INK,
    },
    switch: {
      marginEnd: 0,
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
      paddingTop: verticalScale(24),
      paddingBottom: verticalScale(12),
    },
    emptyImage: {
      width: horizontalScale(72),
      height: horizontalScale(72),
      resizeMode: "contain",
      tintColor: colors.FAINT,
    },
  });
