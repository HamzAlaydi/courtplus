import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: colors.LINE,
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(4),
    },
    itemContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      minHeight: verticalScale(56),
      paddingVertical: verticalScale(8),
    },
    itemDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.DIVIDER,
    },
    iconTile: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: Radius.medium,
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    image: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      color: colors.INK,
    },
    separator: {
      borderBottomColor: colors.DIVIDER,
      borderBottomWidth: 1,
    },
  });
