import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    availabilityContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing[16],
      marginTop: verticalScale(23),
    },
    bookedRowContainer: {
      flexDirection: "row",
      gap: spacing[6],
    },
    bookedDot: {
      height: spacing[16],
      width: spacing[16],
      backgroundColor: colors.SLATE_GRAY,
      borderRadius: spacing[40],
    },
    availableDot: {
      height: spacing[16],
      width: spacing[16],
      backgroundColor: colors.MED_GREEN,
      borderRadius: spacing[40],
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(15),
      paddingHorizontal: spacing[10],
    },
    arrowsContainer: {
      flexDirection: "row",
      gap: spacing[20],
    },
    arrowButton: {
      padding: spacing[4],
    },
    arrowIcon: {
      width: spacing[24],
      height: spacing[24],
      resizeMode: "contain",
      tintColor: colors.BLACK,
    },
    rotateArrow: {
      transform: [{ rotate: "180deg" }],
    },
    disabledArrow: {
      opacity: 0.3,
    },
    disabledArrowIcon: {
      tintColor: colors.GREY,
    },
    month: {
      color: colors.BLACK,
    },
    infoText: {
      color: colors.SLATE_GRAY,
    },
  });
