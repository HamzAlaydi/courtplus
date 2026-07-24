import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    slotsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: verticalScale(24),
    },
    searchInputContainer: {
      backgroundColor: colors.LIGHT_GREY,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      padding: verticalScale(12),
      borderRadius: spacing[12],
      paddingHorizontal: horizontalScale(16),
      paddingVertical: verticalScale(16),
      marginTop: verticalScale(20),
    },
    input: {
      flex: 1,
      color: colors.BLACK,
      textAlign: isRTL ? "right" : "left",
    },
    button: {
      flex: 1,
      justifyContent: "flex-end",
      marginTop: verticalScale(20),
    },
  });
