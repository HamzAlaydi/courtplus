import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
    },
    content: {
      alignItems: "center",
      paddingHorizontal: spacing[24],
    },
    image: {
      width: horizontalScale(53),
      height: horizontalScale(53),
    },
    title: {
      marginTop: verticalScale(32),
    },
    description: {
      marginTop: verticalScale(15),
      color: colors.GREY,
      textAlign: "center",
    },
    deleteButton: {
      marginTop: verticalScale(38),
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
