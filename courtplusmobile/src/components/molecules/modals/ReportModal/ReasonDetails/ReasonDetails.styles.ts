import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      marginTop: verticalScale(18),
      flex: 1,
    },
    reasonChip: {
      alignSelf: "flex-start",
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.medium,
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(10),
    },
    reasonText: {
      color: colors.INK,
    },
    description: {
      marginTop: verticalScale(16),
      color: colors.MUTED,
      lineHeight: moderateScale(21),
    },
    textAreaContainer: {
      marginTop: verticalScale(16),
    },
    textArea: {
      height: verticalScale(135),
    },
    bottomContainer: {
      flex: 1,
      justifyContent: "flex-end",
      paddingTop: verticalScale(16),
    },
  });
