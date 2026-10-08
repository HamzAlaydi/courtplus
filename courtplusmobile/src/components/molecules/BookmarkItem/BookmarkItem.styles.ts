import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      borderRadius: Radius.cardLarge,
      ...Shadows.raised,
    },
    imageBg: {
      width: "100%",
      height: verticalScale(156),
      borderTopLeftRadius: Radius.cardLarge,
      borderTopRightRadius: Radius.cardLarge,
      overflow: "hidden",
      backgroundColor: colors.DIVIDER,
      alignItems: "flex-end",
    },
    image: {
      borderTopLeftRadius: Radius.cardLarge,
      borderTopRightRadius: Radius.cardLarge,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      paddingHorizontal: spacing[14],
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(16),
    },
    textContainer: {
      flex: 1,
      gap: verticalScale(4),
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    locationIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    locationName: {
      color: colors.MUTED,
      flexShrink: 1,
    },
    bookmarkContainer: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      backgroundColor: colors.GLASS_LIGHT,
      marginEnd: spacing[12],
      marginTop: spacing[12],
      borderRadius: Radius.pill,
      justifyContent: "center",
      alignItems: "center",
    },
    bookmarkIcon: {
      tintColor: colors.INK,
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
    },
    arrowButton: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    arrowIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
      transform: [{ scaleX: isRTL ? 1 : -1 }],
    },
  });
