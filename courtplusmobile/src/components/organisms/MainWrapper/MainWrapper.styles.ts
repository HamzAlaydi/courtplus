import { StyleSheet } from "react-native";
import { ColorsType, Layout } from "theme";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.GROUND,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: Layout.gutter,
    },
    white: {
      backgroundColor: colors.CARD,
    },
  });
