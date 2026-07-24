import { StyleSheet } from "react-native";
import { ColorsType, Typography } from "theme";
import { isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      marginTop: verticalScale(11),
      height: verticalScale(85.5),
      padding: 0,
      paddingVertical: verticalScale(10),
      paddingHorizontal: spacing[12],
    },
    label: {
      color: colors.SUBMARINE,
    },
    counter: {
      color: colors.SLATE_GRAY,
      textAlign: "right",
    },
    input: {
      height: verticalScale(45),
      color: colors.BLACK,
      textAlign: isRTL ? "right" : "left",
      ...Typography.headline3.medium,
      padding: 0,
    },
    counterContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
  });
