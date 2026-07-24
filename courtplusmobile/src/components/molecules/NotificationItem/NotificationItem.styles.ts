import { StyleSheet } from "react-native";
import { ColorsType, Typography } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    container: {
      flexDirection: "row",
      gap: spacing[6],
      alignItems: "center",
    },
    imageContainer: {
      width: spacing[40],
      height: spacing[40],
      borderWidth: 2,
      borderColor: colors.WHITE,
      borderRadius: spacing[40],
    },
    content: {
      width: horizontalScale(150),
      color: colors.SLATE_GRAY,
    },
    button: {
      minHeight: verticalScale(22),
      paddingVertical: verticalScale(5),
      backgroundColor: colors.BUTTON_GREEN,
    },
    buttonText: {
      ...Typography.text.semiBold,
    },
  });
