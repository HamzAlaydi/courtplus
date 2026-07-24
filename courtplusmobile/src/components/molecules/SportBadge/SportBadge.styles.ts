import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    sportContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: verticalScale(8),
      paddingVertical: verticalScale(2),
      backgroundColor: colors.LIGHT_BLUE,
    },
    subtitle: {
      color: colors.SLATE_GRAY,
    },
  });
