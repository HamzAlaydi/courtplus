import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
    },
    locationHeader: {
      paddingHorizontal: spacing[24],
    },
    filtersSection: {
      paddingHorizontal: spacing[24],
      paddingTop: verticalScale(20),
      flexDirection: "row",
    },
    sportChips: {
      paddingHorizontal: spacing[24],
      paddingTop: verticalScale(20),
    },
    filterContainer: {
      width: horizontalScale(41.875),
      height: verticalScale(49),
      backgroundColor: colors.LIGHT_GREY,
      borderRadius: horizontalScale(9),
      justifyContent: "center",
      alignItems: "center",
    },
    sortContainer: {
      marginEnd: spacing[16],
    },
    activeFilterContainer: {
      backgroundColor: colors.GREEN,
    },
    activeFilterIcon: {
      tintColor: colors.WHITE,
    },
    searchContainer: {
      flex: 1,
      marginEnd: horizontalScale(21),
    },
    courtCard: {
      paddingHorizontal: spacing[4],
      paddingTop: verticalScale(4),
    },
    courtsList: {
      paddingHorizontal: spacing[24],
      paddingTop: verticalScale(20),
      paddingBottom: verticalScale(20),
    },
    courtSeparator: {
      marginTop: verticalScale(17.36),
    },
  });
