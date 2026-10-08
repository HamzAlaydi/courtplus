import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const ICON_SIZE = horizontalScale(44);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      width: horizontalScale(127),
      alignItems: "center",
      justifyContent: "center",
      gap: verticalScale(6),
      paddingTop: verticalScale(18),
      paddingBottom: verticalScale(16),
      paddingHorizontal: spacing[10],
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.LINE,
      backgroundColor: colors.CARD,
    },
    selectedContainer: {
      borderColor: colors.INK,
      backgroundColor: colors.INK,
    },
    iconContainer: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME_TINT,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: verticalScale(4),
    },
    selectedIconContainer: {
      backgroundColor: colors.LIME,
    },
    image: {
      width: horizontalScale(22),
      height: horizontalScale(22),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    selectedImage: {
      tintColor: colors.INK,
    },
    title: {
      color: colors.INK,
    },
    selectedTitle: {
      color: colors.WHITE,
    },
    itemDescription: {
      color: colors.MUTED,
    },
    selectedItemDescription: {
      color: colors.ON_INK_MUTED,
    },
  });
