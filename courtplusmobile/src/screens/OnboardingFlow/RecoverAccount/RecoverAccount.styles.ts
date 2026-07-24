import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    image: {
      height: verticalScale(442),
      width: "100%",
    },
    description: {
      textAlign: "center",
      marginTop: verticalScale(10.18),
      color: colors.SLATE_GRAY,
    },
    centeredContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    startFreshButton: {
      minHeight: verticalScale(10),
    },
  });
