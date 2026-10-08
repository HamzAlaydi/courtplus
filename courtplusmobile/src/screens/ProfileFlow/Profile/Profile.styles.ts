import { StyleSheet } from "react-native";
import { ColorsType, Layout, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    wrapperContent: {
      paddingHorizontal: 0,
      paddingBottom: 0,
    },
    header: {
      paddingHorizontal: Layout.gutter,
    },
    moreButton: {
      width: Layout.touch,
      height: Layout.touch,
      borderRadius: Layout.touch / 2,
      backgroundColor: colors.CARD,
      justifyContent: "center",
      alignItems: "center",
      ...Shadows.subtle,
    },
    moreIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    settingsIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Layout.gutter,
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(32),
    },
    profileImageHeader: {
      paddingTop: verticalScale(4),
    },
    identity: {
      marginTop: verticalScale(6),
      gap: verticalScale(4),
    },
    username: {
      color: colors.MUTED,
    },
    description: {
      marginTop: verticalScale(6),
      color: colors.INK,
      lineHeight: verticalScale(21),
    },
    sports: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
      flexWrap: "wrap",
      marginTop: verticalScale(14),
    },
    momentsHeader: {
      marginTop: Layout.sectionGap,
    },
    postsContainer: {
      backgroundColor: colors.GROUND,
    },
  });
