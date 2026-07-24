import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      marginTop: verticalScale(20),
    },
    timeSlotSelector: {
      width: "100%",
    },
    timeSection: {
      flexDirection: "row",
      gap: horizontalScale(11.06),
    },
    sectionIndicator: {
      alignItems: "center",
    },
    indicatorDot: {
      width: spacing[8],
      height: spacing[8],
      backgroundColor: colors.GREEN_YELLOWISH,
      borderRadius: spacing[50],
    },
    indicatorLine: {
      borderWidth: spacing[2],
      flex: 1,
      borderColor: colors.LIGHT_BLUE,
    },
    sectionContent: {
      flex: 1,
      marginTop: -verticalScale(8),
    },
    sectionTitle: {
      marginBottom: verticalScale(13),
    },
    slotsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: horizontalScale(4.4),
      marginBottom: verticalScale(16),
    },
    timeSlotContainer: {
      paddingHorizontal: horizontalScale(15),
      paddingVertical: verticalScale(9),
      borderWidth: 1,
      borderColor: colors.LIGHT_BLUE,
      borderRadius: spacing[12],
    },
    selectedSlot: {
      borderColor: "#C0FF42",
      backgroundColor: "#C0FF4233",
    },
    disabledSlot: {
      backgroundColor: colors.MED_GREY_2,
      borderColor: colors.LIGHT_GREY,
    },
    lastLine: {
      flex: 0.85,
    },
    emptyStateContainer: {
      justifyContent: "center",
      alignItems: "center",
      marginTop: verticalScale(68),
      gap: verticalScale(31),
    },
    emptyIcon: {
      width: horizontalScale(96),
      height: horizontalScale(96),
    },
    emptyText: {
      width: horizontalScale(158),
      textAlign: "center",
    },
    selectedSlotText: {
      color: colors.BUTTON_GREEN,
    },
    disabledSlotText: {
      color: colors.MED_GREY,
    },
    slotText: {
      color: colors.BLACK,
    },
  });
