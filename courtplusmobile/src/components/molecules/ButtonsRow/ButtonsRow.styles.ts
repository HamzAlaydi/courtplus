import { StyleSheet } from "react-native";
import { spacing } from "utils";
import { ColorsType } from "theme";

export default (_colors: ColorsType) =>
  StyleSheet.create({
    buttonContainer: {
      flexDirection: "row",
      gap: spacing[10],
    },
    button: {
      flex: 1,
      paddingHorizontal: spacing[12],
    },
  });
