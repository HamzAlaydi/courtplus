import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { moderateScale, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    description: {
      marginTop: verticalScale(4),
      marginBottom: verticalScale(16),
      color: colors.MUTED,
      lineHeight: moderateScale(21),
    },
    preferredTimeContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: verticalScale(12),
    },
    option: {
      width: "48%",
    },
    button: {
      marginTop: verticalScale(24),
    },
  });
