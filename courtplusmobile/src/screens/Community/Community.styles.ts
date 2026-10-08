import { StyleSheet } from "react-native";
import { ColorsType, Layout, Shadows } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    iconContainer: {
      backgroundColor: colors.CARD,
      width: Layout.touch,
      height: Layout.touch,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: Layout.touch / 2,
      ...Shadows.subtle,
    },
    bellIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    searchIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    content: {
      marginTop: verticalScale(14),
      flex: 1,
    },
    list: {
      marginHorizontal: -Layout.gutter,
    },
    loader: {
      marginTop: verticalScale(16),
    },
    separator: {
      height: verticalScale(10),
    },
    listContainer: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(24),
    },
    communityContent: {
      paddingBottom: 0,
    },
  });
