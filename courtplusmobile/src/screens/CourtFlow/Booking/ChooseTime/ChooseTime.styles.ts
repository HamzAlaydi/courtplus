import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    infoContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: verticalScale(25),
    },
    infoWidget: {
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing[4],
      backgroundColor: colors.LIGHT_BLUE,
      paddingVertical: verticalScale(8),
      width: horizontalScale(128),
    },
    infoItem: {
      alignItems: "center",
      gap: spacing[2],
    },
    timezoneContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(7),
      paddingTop: verticalScale(25),
      width: horizontalScale(293.37),
    },
    content: {
      marginTop: verticalScale(21),
    },
    scrollViewContent: {
      paddingBottom: verticalScale(120),
    },
    container: {
      flex: 1,
    },
    timeSlotsContainer: {
      marginTop: verticalScale(9.21),
    },
    horizontalDatePicker: {
      marginTop: verticalScale(29),
    },
  });
