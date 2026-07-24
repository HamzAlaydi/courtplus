import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    amountContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      backgroundColor: "white",
      paddingStart: horizontalScale(27),
      paddingEnd: horizontalScale(21),
      width: "100%",
      paddingTop: verticalScale(28),
      paddingBottom: verticalScale(15),
    },
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    buttonsContainer: {
      backgroundColor: colors.WHITE,
      paddingHorizontal: spacing[24],
      paddingTop: verticalScale(13),
      paddingBottom: verticalScale(39),
      borderTopColor: colors.LIGHT_GREY,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: spacing[16],
    },
    button: {
      flex: 1,
    },
    cancelButton: {
      borderColor: colors.MED_GREY_2,
    },
    cancelButtonText: {
      color: colors.SLATE_GRAY,
    },
    amount: {
      fontSize: moderateScale(24),
    },
    total: {
      color: colors.SLATE_GRAY,
      letterSpacing: 0.05,
    },
  });
