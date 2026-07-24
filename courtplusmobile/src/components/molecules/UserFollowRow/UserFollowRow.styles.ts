import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    profileContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    username: {
      color: colors.GREY,
    },
    icon: {
      tintColor: colors.MED_GREEN,
    },
    image: {
      width: spacing[40],
      height: spacing[40],
      borderRadius: spacing[40],
    },
    button: {
      borderRadius: spacing[20],
      backgroundColor: colors.LIGHT_BLUE,
      minHeight: verticalScale(38),
      paddingVertical: 0,
    },
    buttonText: {
      color: colors.DARK_BLUE,
    },
  });
