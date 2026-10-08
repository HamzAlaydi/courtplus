import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(8),
      paddingHorizontal: spacing[14],
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.tile,
    },
    radioButton: {
      minHeight: verticalScale(54),
    },
    radioDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.DIVIDER,
    },
    buttons: {
      paddingTop: verticalScale(22),
      paddingBottom: verticalScale(8),
    },
  });
