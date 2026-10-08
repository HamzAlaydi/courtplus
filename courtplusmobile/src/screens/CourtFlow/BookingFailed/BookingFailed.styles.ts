import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { horizontalScale, verticalScale } from "utils";

const BADGE_SIZE = horizontalScale(104);
const HALO_SIZE = horizontalScale(164);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.GROUND,
      paddingHorizontal: Layout.gutter,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: verticalScale(36),
    },
    halo: {
      width: HALO_SIZE,
      height: HALO_SIZE,
      borderRadius: Radius.pill,
      backgroundColor: colors.DANGER_BG,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      width: BADGE_SIZE,
      height: BADGE_SIZE,
      borderRadius: Radius.pill,
      backgroundColor: colors.CARD,
      alignItems: "center",
      justifyContent: "center",
      ...Shadows.card,
    },
    icon: {
      width: horizontalScale(30),
      height: horizontalScale(30),
      resizeMode: "contain",
      tintColor: colors.DANGER,
    },
    texts: {
      alignItems: "center",
      gap: verticalScale(10),
      paddingHorizontal: horizontalScale(8),
    },
    title: {
      color: colors.INK,
      textAlign: "center",
    },
    subtitle: {
      color: colors.MUTED,
      textAlign: "center",
    },
  });
