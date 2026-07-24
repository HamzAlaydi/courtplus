import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    mapContainer: {
      height: verticalScale(381),
      overflow: "hidden",
    },
    map: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: spacing[22],
      marginTop: verticalScale(10),
      overflow: "hidden",
    },
    locationContainer: {
      flexDirection: "row",
      gap: spacing[6],
      paddingTop: verticalScale(25),
    },
    buttonContainer: {
      flexDirection: "row",
      gap: spacing[16],
      paddingVertical: verticalScale(24),
    },
    button: {
      flex: 1,
    },
    radiusContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: verticalScale(18),
      paddingBottom: verticalScale(16),
    },
    radiusText: {
      color: colors.SLATE_GRAY,
    },
  });
