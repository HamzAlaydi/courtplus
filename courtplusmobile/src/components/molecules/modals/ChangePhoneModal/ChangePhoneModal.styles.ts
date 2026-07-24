import { StyleSheet } from "react-native";
import { ColorsType, Typography } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
    },
    changePhoneButton: {
      marginTop: verticalScale(23.2),
      backgroundColor: "transparent",
      borderTopWidth: 1,
      borderTopColor: colors.MED_GREY_2,
      borderBottomWidth: 1,
      borderBottomColor: colors.MED_GREY_2,
    },
    changePhoneButtonText: {
      color: colors.SLATE_GRAY,
      ...Typography.fields.semiBold,
    },
    cancelButton: {
      backgroundColor: "transparent",
    },
    cancelButtonText: {
      color: colors.SLATE_GRAY,
    },
    centeredContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: horizontalScale(41),
      height: verticalScale(43),
    },
    title: {
      width: horizontalScale(140),
      textAlign: "center",
      marginTop: verticalScale(23.2),
    },
    description: {
      width: horizontalScale(208),
      marginTop: verticalScale(17),
      color: colors.GREY,
      textAlign: "center",
    },
  });
