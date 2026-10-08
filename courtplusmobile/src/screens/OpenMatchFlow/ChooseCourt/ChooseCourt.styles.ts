import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius, Shadows } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: 0,
    },
    header: {
      paddingHorizontal: Layout.gutter,
    },
    locationHeader: {
      marginHorizontal: Layout.gutter,
      marginTop: verticalScale(16),
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(12),
      backgroundColor: colors.CARD,
      borderRadius: Radius.input,
      borderWidth: 1,
      borderColor: colors.LINE,
      ...Shadows.subtle,
    },
    resultsContainer: {
      paddingHorizontal: Layout.gutter,
      marginTop: verticalScale(18),
    },
    resultsText: {
      color: colors.MUTED,
    },
    loader: {
      paddingHorizontal: Layout.gutter,
      marginTop: verticalScale(12),
    },
    contentList: {
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(24),
    },
    separator: {
      height: verticalScale(16),
    },
  });
