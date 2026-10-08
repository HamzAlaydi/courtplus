import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

/** Distance from the top safe-area edge: header padding, button, gap. */
export const MENU_OFFSET = verticalScale(8) + Layout.touch + verticalScale(8);

export default (colors: ColorsType) =>
  StyleSheet.create({
    modal: {
      margin: 0,
      alignItems: "flex-end",
      justifyContent: "flex-start",
      paddingHorizontal: Layout.gutter,
    },
    container: {
      minWidth: horizontalScale(180),
      backgroundColor: colors.CARD,
      borderRadius: Radius.tile,
      paddingVertical: verticalScale(6),
      paddingHorizontal: spacing[6],
      ...Shadows.raised,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      minHeight: Layout.touch,
      paddingHorizontal: spacing[8],
      paddingVertical: verticalScale(6),
      borderRadius: Radius.medium,
    },
    iconTile: {
      width: horizontalScale(32),
      height: horizontalScale(32),
      borderRadius: Radius.small,
      backgroundColor: colors.GROUND,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    text: {
      flexShrink: 1,
      color: colors.INK,
    },
    separator: {
      height: 1,
      marginHorizontal: spacing[8],
      backgroundColor: colors.DIVIDER,
    },
  });
