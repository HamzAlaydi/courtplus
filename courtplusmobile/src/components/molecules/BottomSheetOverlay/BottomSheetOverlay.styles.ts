import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType, isWhite: boolean) =>
  StyleSheet.create({
    modal: {
      backgroundColor: isWhite ? colors.CARD : colors.INK,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
    },
    handle: {
      paddingTop: verticalScale(10),
      paddingBottom: verticalScale(4),
    },
    handleIndicator: {
      width: horizontalScale(40),
      height: 5,
      borderRadius: Radius.pill,
      backgroundColor: isWhite ? colors.HANDLE : colors.ON_INK_LINE,
    },
    backdrop: {
      backgroundColor: colors.INK,
    },
    container: {
      flexGrow: 1,
      paddingHorizontal: spacing[20],
      backgroundColor: isWhite ? colors.CARD : colors.INK,
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(24),
    },
    closeButtonContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      marginBottom: verticalScale(8),
    },
    closeButton: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isWhite ? colors.GROUND : colors.ON_INK_SURFACE,
      borderRadius: horizontalScale(18),
    },
    closeIcon: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      resizeMode: "contain",
      tintColor: isWhite ? colors.INK : colors.WHITE,
    },
    title: {
      flex: 1,
      color: isWhite ? colors.INK : colors.WHITE,
    },
    wrapper: {
      flex: 1,
      paddingHorizontal: spacing[20],
    },
  });
