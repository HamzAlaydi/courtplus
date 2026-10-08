import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { horizontalScale, verticalScale } from "utils";

const LOGO_SIZE = horizontalScale(88);
const LOGO_RING = horizontalScale(4);

export default (colors: ColorsType) =>
  StyleSheet.create({
    image: {
      width: "100%",
      height: verticalScale(260),
      backgroundColor: colors.DIVIDER,
    },
    container: {
      paddingHorizontal: Layout.gutter,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    icon: {
      backgroundColor: colors.GLASS_LIGHT,
      width: Layout.touch,
      height: Layout.touch,
      borderRadius: Radius.pill,
      justifyContent: "center",
      alignItems: "center",
      ...Shadows.subtle,
    },
    backIcon: {
      tintColor: colors.INK,
    },
    dotIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    sheetTop: {
      marginTop: -Radius.sheet,
      paddingTop: verticalScale(12),
      paddingHorizontal: Layout.gutter,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      backgroundColor: colors.CARD,
      borderTopStartRadius: Radius.sheet,
      borderTopEndRadius: Radius.sheet,
    },
    logoRing: {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      marginTop: -horizontalScale(52),
      padding: LOGO_RING,
      borderRadius: Radius.pill,
      backgroundColor: colors.CARD,
      alignItems: "center",
      justifyContent: "center",
      ...Shadows.card,
    },
    logo: {
      width: LOGO_SIZE - LOGO_RING * 2,
      height: LOGO_SIZE - LOGO_RING * 2,
      borderRadius: Radius.pill,
      backgroundColor: colors.DIVIDER,
    },
    logoFallback: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    button: {
      maxWidth: horizontalScale(160),
    },
    likedButton: {
      backgroundColor: colors.LIME_TINT,
      borderColor: colors.LIME_TINT_BORDER,
    },
    likeIcon: {
      tintColor: colors.INK,
    },
    likedIcon: {
      tintColor: colors.LIME_TINT_TEXT,
    },
  });
