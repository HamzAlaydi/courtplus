import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[24],
      flexWrap: "wrap",
    },
    column: {
      gap: verticalScale(6),
    },
    iconContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
    },
    subtitle: {
      color: colors.SLATE_GRAY,
    },
    divider: {
      width: horizontalScale(1),
      height: verticalScale(56),
      backgroundColor: colors.LIGHT_GREY,
    },
    dividerBlack: {
      backgroundColor: colors.BLACK,
    },
    image: {
      tintColor: colors.BLACK,
    },
  });
