import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[22],
    },
    radioContainer: {
      width: spacing[18],
      height: spacing[18],
      borderRadius: spacing[50],
      borderWidth: 1,
      borderColor: colors.BLACK,
      justifyContent: "center",
      alignItems: "center",
    },
    radio: {
      width: spacing[14],
      height: spacing[14],
      borderRadius: spacing[50],
      backgroundColor: colors.GREEN_YELLOWISH,
    },
    cardContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    amountContainer: {
      gap: spacing[2],
      flexDirection: "row",
      alignItems: "center",
    },
    amountText: {
      marginTop: verticalScale(3),
    },
  });
