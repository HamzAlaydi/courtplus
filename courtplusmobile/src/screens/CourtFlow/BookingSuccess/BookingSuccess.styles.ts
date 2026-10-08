import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius } from "theme";
import { horizontalScale, verticalScale } from "utils";

export const STAGE_SIZE = horizontalScale(300);
const BADGE_SIZE = horizontalScale(112);
const HALO_INNER_SIZE = horizontalScale(164);
const HALO_OUTER_SIZE = horizontalScale(228);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.INK,
      paddingHorizontal: Layout.gutter,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: verticalScale(12),
    },
    stage: {
      width: STAGE_SIZE,
      height: STAGE_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    haloOuter: {
      position: "absolute",
      width: HALO_OUTER_SIZE,
      height: HALO_OUTER_SIZE,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.ON_INK_LINE,
    },
    haloInner: {
      position: "absolute",
      width: HALO_INNER_SIZE,
      height: HALO_INNER_SIZE,
      borderRadius: Radius.pill,
      backgroundColor: colors.ON_INK_SURFACE,
    },
    ripple: {
      position: "absolute",
      width: BADGE_SIZE,
      height: BADGE_SIZE,
      borderRadius: Radius.pill,
      borderWidth: 2,
      borderColor: colors.LIME,
    },
    badge: {
      width: BADGE_SIZE,
      height: BADGE_SIZE,
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME,
      alignItems: "center",
      justifyContent: "center",
    },
    checkIcon: {
      width: horizontalScale(46),
      height: horizontalScale(34),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    texts: {
      alignItems: "center",
      gap: verticalScale(10),
      paddingHorizontal: horizontalScale(8),
    },
    title: {
      color: colors.WHITE,
      textAlign: "center",
    },
    subtitle: {
      color: colors.ON_INK_MUTED,
      textAlign: "center",
    },
  });
