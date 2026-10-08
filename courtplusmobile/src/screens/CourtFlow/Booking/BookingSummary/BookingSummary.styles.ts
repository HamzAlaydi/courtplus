import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(16),
      gap: verticalScale(16),
    },
    title: {
      color: colors.INK,
    },
    paymentOptionsContainer: {
      gap: verticalScale(10),
    },
    termsContainer: {
      gap: verticalScale(6),
      paddingVertical: verticalScale(14),
      paddingHorizontal: spacing[14],
      borderRadius: Radius.tile,
      backgroundColor: colors.SUBTLE,
      borderWidth: 1,
      borderColor: colors.DIVIDER,
    },
    termsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
      marginBottom: verticalScale(2),
    },
    termsIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    termsTitle: {
      color: colors.INK,
    },
    termsText: {
      color: colors.MUTED,
      lineHeight: moderateScale(18),
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: verticalScale(200),
    },
  });
