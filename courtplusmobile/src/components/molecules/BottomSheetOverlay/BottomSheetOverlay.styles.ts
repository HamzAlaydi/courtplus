import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType, isWhite: boolean) =>
  StyleSheet.create({
    modal: {
      backgroundColor: isWhite ? colors.WHITE : colors.BACKGROUND,
      borderRadius: spacing[24],
    },
    container: {
      flexGrow: 1,
      paddingHorizontal: spacing[24],
      backgroundColor: isWhite ? colors.WHITE : colors.BACKGROUND,
      paddingTop: verticalScale(21),
      paddingBottom: verticalScale(19),
    },
    closeButtonContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    closeButton: {
      width: horizontalScale(27),
      height: horizontalScale(27),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.GREEN_YELLOWISH,
      borderRadius: spacing[40],
    },
    title: {
      color: isWhite ? colors.BLACK : colors.WHITE,
    },
    wrapper: {
      flex: 1,
      paddingHorizontal: spacing[24],
    },
  });
