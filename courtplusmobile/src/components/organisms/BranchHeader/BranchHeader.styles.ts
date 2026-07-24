import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    image: {
      width: "100%",
      height: verticalScale(235),
    },
    container: {
      paddingHorizontal: spacing[24],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logo: {
      width: horizontalScale(104),
      height: horizontalScale(104),
      left: spacing[24],
      top: verticalScale(75),
      zIndex: 2,
      position: "absolute",
      borderRadius: horizontalScale(96),
    },
    button: {
      zIndex: 2,
      position: "absolute",
      bottom: -verticalScale(20),
      right: spacing[24],
    },
    infoContainer: {
      flex: 1,
      justifyContent: "space-between",
      flexDirection: "row",
      alignItems: "flex-end",
    },
    icon: {
      backgroundColor: `${colors.WHITE}80`,
      width: spacing[40],
      height: spacing[40],
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
    backIcon: {
      tintColor: colors.BLACK,
    },
  });
