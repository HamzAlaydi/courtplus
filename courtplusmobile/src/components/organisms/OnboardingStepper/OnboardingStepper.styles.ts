import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.INK,
    },
    header: {
      position: "absolute",
      top: 0,
      start: 0,
      end: 0,
      paddingHorizontal: Layout.gutter,
      paddingBottom: verticalScale(12),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerShade: {
      position: "absolute",
      top: 0,
      start: 0,
      end: 0,
      height: verticalScale(150),
    },
    logo: {
      width: horizontalScale(132),
      height: horizontalScale(38),
      resizeMode: "contain",
    },
    skipButton: {
      minHeight: horizontalScale(36),
      paddingHorizontal: spacing[16],
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.ON_INK_LINE,
      backgroundColor: colors.ON_INK_SURFACE,
      alignItems: "center",
      justifyContent: "center",
    },
    skipText: {
      color: colors.WHITE,
    },
    pager: {
      flex: 1,
    },
    page: {
      flex: 1,
    },
    image: {
      flex: 1,
      justifyContent: "flex-end",
    },
    imageStyle: {
      width: "100%",
      height: "100%",
    },
    pageShade: {
      position: "absolute",
      start: 0,
      end: 0,
      bottom: 0,
      height: "55%",
    },
    slideContent: {
      paddingHorizontal: Layout.gutter,
      paddingBottom: verticalScale(8),
      gap: verticalScale(10),
    },
    title: {
      color: colors.WHITE,
    },
    description: {
      color: colors.ON_INK_MUTED,
    },
    footer: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(20),
    },
    dots: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
      marginBottom: verticalScale(20),
    },
    dot: {
      height: horizontalScale(6),
      borderRadius: Radius.pill,
    },
    terms: {
      color: colors.ON_INK_MUTED,
      textAlign: "center",
      marginTop: verticalScale(14),
    },
  });
