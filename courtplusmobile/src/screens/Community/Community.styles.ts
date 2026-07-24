import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    iconContainer: {
      backgroundColor: colors.GHOST_WHITE,
      width: spacing[40],
      height: spacing[40],
      justifyContent: "center",
      alignItems: "center",
      borderRadius: spacing[40],
    },
    headerMainContainer: {
      justifyContent: "space-between",
    },
    content: {
      marginTop: verticalScale(20),
      flex: 1,
    },
    separator: {
      marginTop: verticalScale(10.75),
      marginBottom: verticalScale(16),
    },
    listContainer: {
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(20),
    },
    itemContainer: {
      marginTop: 0,
    },
    communityContent: {
      paddingBottom: 0,
    },
  });
