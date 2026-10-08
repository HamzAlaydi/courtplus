import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    hero: {
      height: verticalScale(360),
      alignItems: "center",
      justifyContent: "center",
    },
    disc: {
      position: "absolute",
      width: horizontalScale(280),
      height: horizontalScale(280),
      borderRadius: horizontalScale(140),
      backgroundColor: colors.CARD,
    },
    image: {
      height: verticalScale(340),
      width: "100%",
      resizeMode: "contain",
    },
    centeredContainer: {
      alignItems: "center",
      paddingHorizontal: horizontalScale(8),
      marginTop: verticalScale(8),
    },
    title: {
      textAlign: "center",
    },
    description: {
      textAlign: "center",
      marginTop: verticalScale(10),
      color: colors.MUTED,
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
      paddingTop: verticalScale(28),
      paddingBottom: verticalScale(8),
    },
    startFreshButton: {
      marginTop: verticalScale(4),
    },
  });
