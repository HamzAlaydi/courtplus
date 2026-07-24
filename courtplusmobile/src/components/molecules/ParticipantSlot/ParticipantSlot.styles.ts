import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    availableContainer: {
      gap: verticalScale(2),
      alignItems: "center",
      justifyContent: "center",
    },
    container: {
      width: spacing[40],
      height: spacing[40],
      borderRadius: spacing[40],
      borderWidth: 1,
      borderColor: colors.LIGHT_GREY,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
    },
    icon: {
      width: spacing[8],
      height: spacing[8],
    },
    image: {
      width: spacing[40],
      height: spacing[40],
      borderRadius: spacing[40],
    },
    availableText: {
      color: colors.SLATE_GRAY,
    },
    name: {
      color: colors.BLACK,
      width: spacing[50],
      textAlign: "center",
    },
    username: {
      color: colors.GREY,
      width: horizontalScale(38),
    },
    closeIcon: {
      width: horizontalScale(2.76),
      height: horizontalScale(2.76),
      tintColor: colors.WHITE,
    },
    closeButton: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: `${colors.MED_RED}99`,
      width: horizontalScale(10.63),
      height: horizontalScale(10.63),
      justifyContent: "center",
      alignItems: "center",
      borderColor: `${colors.MED_RED}29`,
      borderWidth: 1.5,
    },
    extraMargin: {
      marginTop: verticalScale(18),
    },
  });
