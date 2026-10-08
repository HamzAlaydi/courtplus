import { StyleSheet } from "react-native";
import { ColorsType, Layout } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    tabs: {
      paddingTop: Layout.sectionGap,
      backgroundColor: colors.CARD,
    },
    content: {
      backgroundColor: colors.CARD,
      flex: 1,
      paddingTop: verticalScale(16),
    },
  });
