import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: spacing[12],
      paddingTop: verticalScale(8),
    },
    option: {
      flex: 1,
      alignItems: "center",
      gap: verticalScale(10),
      paddingVertical: verticalScale(18),
      paddingHorizontal: spacing[12],
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    iconCircle: {
      width: horizontalScale(52),
      height: horizontalScale(52),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: horizontalScale(22),
      height: horizontalScale(22),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    label: {
      color: colors.INK,
    },
  });
