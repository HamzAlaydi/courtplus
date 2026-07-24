import { ColorsType } from "theme";
import { StyleSheet } from "react-native";
import { spacing } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    image: {
      width: spacing[20],
      height: spacing[20],
      tintColor: colors.GREY,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
  });
