import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { isAndroid, isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    countryItemContainer: {
      flexDirection: "row",
      gap: spacing[6],
      alignItems: "center",
    },
    countryItemFlag: {
      width: spacing[18],
      height: spacing[18],
    },
    countryItemSeparator: {
      width: 1,
      height: verticalScale(21),
      backgroundColor: colors.CYAN,
    },
    countryCode: {
      color: colors.CYAN,
      lineHeight: isAndroid ? verticalScale(20) : isRTL ? verticalScale(25) : 0,
    },
  });
