import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      paddingTop: verticalScale(8),
    },
    searchIcon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    mapContainer: {
      height: verticalScale(300),
      marginTop: verticalScale(12),
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: colors.LINE,
      backgroundColor: colors.GROUND,
      overflow: "hidden",
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
      paddingTop: verticalScale(12),
    },
    locationIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.MUTED,
    },
    locationText: {
      flexShrink: 1,
      color: colors.MUTED,
    },
    radiusContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: verticalScale(20),
      paddingBottom: verticalScale(10),
    },
    radiusBadge: {
      paddingHorizontal: spacing[12],
      paddingVertical: verticalScale(4),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME_TINT,
    },
    radiusText: {
      color: colors.LIME_TINT_TEXT,
    },
    buttonContainer: {
      paddingTop: verticalScale(22),
      paddingBottom: verticalScale(8),
    },
  });
