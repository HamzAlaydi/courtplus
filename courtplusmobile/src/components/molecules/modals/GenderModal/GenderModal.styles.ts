import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType, isWhite: boolean) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(8),
      paddingHorizontal: spacing[14],
      backgroundColor: isWhite ? colors.SUBTLE : colors.ON_INK_SURFACE,
      borderRadius: Radius.tile,
    },
    option: {
      minHeight: verticalScale(54),
    },
    optionDivider: {
      borderBottomWidth: 1,
      borderBottomColor: isWhite ? colors.DIVIDER : colors.ON_INK_LINE,
    },
    button: {
      marginTop: verticalScale(22),
    },
  });
