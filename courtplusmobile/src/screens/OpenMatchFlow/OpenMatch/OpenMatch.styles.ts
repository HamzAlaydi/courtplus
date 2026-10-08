import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.GROUND,
    },
    mainContainer: {
      paddingBottom: 0,
    },
    intro: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      marginTop: verticalScale(16),
      paddingHorizontal: spacing[16],
      paddingVertical: verticalScale(16),
      borderRadius: Radius.card,
      backgroundColor: colors.INK,
    },
    introIconContainer: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: horizontalScale(22),
      backgroundColor: colors.LIME,
      alignItems: "center",
      justifyContent: "center",
    },
    introIcon: {
      width: horizontalScale(22),
      height: horizontalScale(22),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    introText: {
      flex: 1,
      gap: verticalScale(4),
    },
    introTitle: {
      color: colors.WHITE,
    },
    description: {
      color: colors.ON_INK_MUTED,
    },
    loader: {
      marginTop: verticalScale(18),
    },
    listContainer: {
      paddingTop: verticalScale(18),
      paddingHorizontal: spacing[2],
      paddingBottom: verticalScale(120),
    },
    separator: {
      height: verticalScale(14),
    },
    startMatchContainer: {
      position: "absolute",
      alignSelf: "center",
    },
    startMatchButton: {
      paddingStart: spacing[8],
      paddingEnd: spacing[24],
      gap: spacing[10],
      ...Shadows.raised,
    },
    plusContainer: {
      width: horizontalScale(38),
      height: horizontalScale(38),
      backgroundColor: colors.INK,
      borderRadius: horizontalScale(19),
      justifyContent: "center",
      alignItems: "center",
    },
    plusIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.LIME,
    },
  });
