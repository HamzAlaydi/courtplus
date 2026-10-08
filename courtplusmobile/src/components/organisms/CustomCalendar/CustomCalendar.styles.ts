import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    calendar: {
      backgroundColor: "transparent",
    },
    header: {
      paddingVertical: verticalScale(8),
    },
    month: {
      color: colors.INK,
    },
    arrow: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      padding: 0,
      borderRadius: Radius.pill,
      backgroundColor: colors.GROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    availabilityContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing[16],
      marginTop: verticalScale(16),
      paddingHorizontal: spacing[12],
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
    },
    bookedDot: {
      height: spacing[10],
      width: spacing[10],
      backgroundColor: colors.HANDLE,
      borderRadius: Radius.pill,
    },
    availableDot: {
      height: spacing[10],
      width: spacing[10],
      backgroundColor: colors.INK,
      borderRadius: Radius.pill,
    },
    infoText: {
      color: colors.MUTED,
    },
  });
