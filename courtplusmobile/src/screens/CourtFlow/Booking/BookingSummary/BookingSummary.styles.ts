import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(21),
    },
    title: {
      color: colors.SLATE_GRAY,
      marginTop: verticalScale(25),
      textAlign: "center",
      letterSpacing: 0.1,
    },
    input: {
      marginTop: verticalScale(32),
    },
    description: {
      marginTop: verticalScale(10),
      color: colors.GREY,
      marginStart: horizontalScale(20),
    },
    infoContainer: {
      flexDirection: "row",
      gap: spacing[10],
    },

    termsContainer: {
      marginTop: verticalScale(24),
    },
    branchName: {
      color: colors.SLATE_GRAY,
    },
    paymentOptionsContainer: {
      marginTop: verticalScale(21),
      gap: verticalScale(16),
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: verticalScale(180),
    },
  });
