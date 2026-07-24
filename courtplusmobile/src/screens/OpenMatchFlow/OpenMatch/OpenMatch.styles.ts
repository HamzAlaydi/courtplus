import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    actionContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[10],
    },
    listContainer: {
      paddingTop: verticalScale(19),
      paddingHorizontal: spacing[2],
      paddingBottom: verticalScale(100),
    },
    separator: {
      marginTop: verticalScale(22.23),
    },
    startMatchContainer: {
      width: horizontalScale(160),
      position: "absolute",
      bottom: 0,
      height: verticalScale(50),
      alignSelf: "center",
      marginBottom: verticalScale(37),
      gap: spacing[12],
    },
    plusContainer: {
      width: spacing[44],
      height: spacing[44],
      backgroundColor: colors.BLACK,
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
    plusIcon: {
      tintColor: colors.GREEN_YELLOWISH,
    },
    description: {
      marginTop: verticalScale(11),
      color: colors.SLATE_GRAY,
    },
    content: {
      marginTop: verticalScale(20),
    },
    container: {
      flex: 1,
    },
    leadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: horizontalScale(15),
    },
    mainContainer: {
      paddingBottom: 0,
    },
  });
