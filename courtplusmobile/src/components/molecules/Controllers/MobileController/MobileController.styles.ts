import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

/**
 * `greyBackground` puts the field on a light screen (white field, ink text);
 * otherwise it sits on a dark screen (deep field, white text).
 */
export default (colors: ColorsType, greyBackground: boolean) =>
  StyleSheet.create({
    countryItemContainer: {
      flexDirection: "row",
      gap: spacing[6],
      alignItems: "center",
    },
    countryItemFlag: {
      width: horizontalScale(20),
      height: horizontalScale(20),
    },
    arrowIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: greyBackground ? colors.MUTED : colors.ON_INK_MUTED,
    },
    countryItemSeparator: {
      width: 1,
      height: verticalScale(20),
      backgroundColor: greyBackground ? colors.LINE : colors.ON_INK_LINE,
    },
    countryCode: {
      color: greyBackground ? colors.MUTED : colors.ON_INK_MUTED,
    },
  });
