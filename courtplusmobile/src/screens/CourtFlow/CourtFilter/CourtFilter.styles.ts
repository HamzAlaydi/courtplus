import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing[24],
    },
    header: {
      justifyContent: "space-between",
      alignItems: "center",
    },
    clearText: {
      color: "#A8B0BE",
    },
    sectionTitle: {
      marginTop: verticalScale(24),
    },
    subSectionTitle: {
      marginTop: verticalScale(20),
      color: colors.SLATE_GRAY,
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[6],
      marginTop: verticalScale(12),
    },
    iconContainer: {
      backgroundColor: colors.WHITE,
      padding: spacing[6],
      height: spacing[36],
      width: spacing[36],
      justifyContent: "center",
      alignItems: "center",
      borderRadius: spacing[32],
    },
    selectedIconContainer: {
      backgroundColor: colors.BLACK,
    },
    icon: {
      tintColor: colors.BLACK,
    },
    selectedIcon: {
      tintColor: colors.GREEN_YELLOWISH,
    },
    ratingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      marginTop: verticalScale(12),
    },
    ratingHint: {
      color: colors.SLATE_GRAY,
    },
    availabilityHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: verticalScale(24),
    },
    datePicker: {
      marginTop: verticalScale(12),
    },
    periodsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: horizontalScale(24),
      marginTop: verticalScale(12),
    },
    durationChip: {
      paddingHorizontal: spacing[12],
    },
    applyButton: {
      marginTop: verticalScale(32),
    },
  });
