import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[8],
      paddingHorizontal: horizontalScale(17),
      paddingVertical: verticalScale(10),
      backgroundColor: colors.LIGHT_BLUE,
      borderColor: colors.WHITE,
      borderWidth: 2,
      borderRadius: spacing[20],
      maxWidth: horizontalScale(108),
    },
    icon: {
      width: spacing[16],
      height: spacing[16],
    },
  });
