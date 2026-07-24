import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    modal: {
      alignItems: "flex-end",
      justifyContent: "flex-start",
      paddingTop: verticalScale(56),
    },
    container: {
      backgroundColor: colors.WHITE,
      width: horizontalScale(141),
      borderRadius: horizontalScale(13),
      paddingBottom: verticalScale(15),
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(23),
      paddingTop: verticalScale(18),
      paddingStart: horizontalScale(17),
      paddingEnd: horizontalScale(37),
    },
    separator: {
      borderWidth: 1,
      borderColor: colors.LIGHT_GREY,
      marginTop: verticalScale(14),
      width: "100%",
    },
  });
