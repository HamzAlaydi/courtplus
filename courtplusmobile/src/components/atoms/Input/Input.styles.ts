import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.GHOST_WHITE,
      borderRadius: spacing[12],
      paddingHorizontal: spacing[16],
      paddingVertical: verticalScale(16),
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    input: {
      flex: 1,
      color: colors.BLACK,
      textAlign: isRTL ? "right" : "left",
    },
  });
