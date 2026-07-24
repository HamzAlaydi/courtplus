import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: verticalScale(4),
    },
    centerContainer: {
      alignItems: "center",
    },
    userContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    image: {
      width: horizontalScale(38),
      height: horizontalScale(38),
      borderRadius: horizontalScale(50),
    },
    username: {
      color: colors.SLATE_GRAY,
    },
    comment: {
      marginTop: verticalScale(5.25),
    },
    date: {
      color: colors.SLATE_GRAY,
      marginTop: verticalScale(6),
    },
  });
