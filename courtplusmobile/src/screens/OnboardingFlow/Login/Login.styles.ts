import { StyleSheet } from "react-native";
import { ColorsType, Layout } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType, top: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.INK,
      paddingTop: top + verticalScale(8),
      paddingBottom: verticalScale(12),
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Layout.gutter,
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: Layout.gutter,
    },
    title: {
      color: colors.WHITE,
    },
    input: {
      marginTop: verticalScale(20),
    },
    button: {
      marginTop: verticalScale(16),
    },
    logo: {
      width: horizontalScale(132),
      height: horizontalScale(38),
      resizeMode: "contain",
    },
    keyboard: {
      flexGrow: 1,
    },
  });
