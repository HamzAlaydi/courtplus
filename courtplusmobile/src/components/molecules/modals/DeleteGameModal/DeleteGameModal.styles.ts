import { StyleSheet } from "react-native";
import { ColorsType, Typography } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: horizontalScale(55),
      height: verticalScale(55),
    },
    title: {
      marginTop: verticalScale(14.5),
      textAlign: "center",
    },
    deleteButton: {
      marginTop: verticalScale(24),
      backgroundColor: "transparent",
      borderTopWidth: 1,
      borderTopColor: colors.MED_GREY_2,
      borderBottomWidth: 1,
      borderBottomColor: colors.MED_GREY_2,
    },
    deleteButtonText: {
      color: colors.MED_RED,
    },
    cancelButton: {
      backgroundColor: "transparent",
    },
    cancelButtonText: {
      color: colors.SLATE_GRAY,
    },
  });
