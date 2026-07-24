import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.WHITE,
    },
    listActionItem: {
      marginTop: verticalScale(46),
    },
    switch: {
      marginEnd: spacing[24],
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    emptyImage: {
      width: horizontalScale(84),
      height: verticalScale(99.24),
      tintColor: colors.SLATE_GRAY,
    },
  });
