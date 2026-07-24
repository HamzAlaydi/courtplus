import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    imageBackground: {
      flex: 1,
      paddingTop: verticalScale(32),
      marginTop: verticalScale(24),
    },
    contentContainer: {
      alignItems: "center",
      gap: verticalScale(4),
    },
    dottedLine: {
      height: 1,
      borderColor: "#D6DAE2",
      marginVertical: verticalScale(24),
      borderStyle: "dotted",
      borderWidth: 1,
    },
    listContainer: {
      paddingHorizontal: spacing[32],
    },
    listItem: {
      color: colors.GREY,
    },
    listItemContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    secondDottedLine: {
      width: "90%",
      marginStart: horizontalScale(18),
    },
    bookingId: {
      textAlign: "center",
      width: horizontalScale(145),
      color: colors.GRAYISH_BLUE,
    },
    listValue: {
      width: horizontalScale(143),
      textAlign: "right",
    },
  });
