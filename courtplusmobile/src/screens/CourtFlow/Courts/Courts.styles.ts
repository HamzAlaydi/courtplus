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
      // The two icon buttons are a fixed 49 tall while the search Input sizes
      // itself from its padding and ends up taller. Without this the row fell
      // back to the default cross-axis behaviour, the buttons pinned to the
      // top, and the search box visibly hung below them.
      alignItems: "center",
      gap: spacing[12],
    },
    sportChips: {
      paddingHorizontal: spacing[24],
      paddingTop: verticalScale(20),
    },
    filterContainer: {
      width: horizontalScale(49),
      height: verticalScale(49),
      backgroundColor: colors.LIGHT_GREY,
      borderRadius: horizontalScale(9),
      justifyContent: "center",
      alignItems: "center",
    },
    sortContainer: {},
    activeFilterContainer: {
      backgroundColor: colors.GREEN,
    },
    activeFilterIcon: {
      tintColor: colors.WHITE,
    },
    searchContainer: {
      flex: 1,
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
