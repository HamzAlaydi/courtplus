import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    description: {
      marginTop: verticalScale(4),
      color: colors.MUTED,
      lineHeight: moderateScale(21),
    },
    itemsContainer: {
      marginTop: verticalScale(16),
      paddingHorizontal: spacing[14],
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.tile,
    },
    item: {
      minHeight: verticalScale(54),
    },
    itemDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.DIVIDER,
    },
    button: {
      marginTop: verticalScale(22),
    },
  });
