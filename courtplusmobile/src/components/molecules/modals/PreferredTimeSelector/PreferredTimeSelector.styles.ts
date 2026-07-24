import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    description: {
      marginTop: verticalScale(22),
      color: colors.SLATE_GRAY,
      width: horizontalScale(240),
      marginBottom: verticalScale(25.55),
    },
    preferredTimeContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: horizontalScale(51),
    },
    button: {
      marginTop: verticalScale(40.26),
    },
  });
