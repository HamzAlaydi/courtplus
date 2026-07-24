import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      borderRadius: spacing[12],
      borderWidth: 1,
      borderColor: colors.LIGHT_GREY,
      paddingHorizontal: spacing[4],
      paddingTop: verticalScale(4),
    },
    content: {
      paddingTop: verticalScale(32),
      paddingBottom: verticalScale(20),
      paddingStart: spacing[12],
      paddingEnd: spacing[16],
    },
    imageBg: {
      width: "100%",
      height: verticalScale(255),
      alignItems: "flex-end",
    },
    image: {
      borderRadius: spacing[12],
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      paddingTop: verticalScale(16),
    },
    locationName: {
      color: colors.SLATE_GRAY,
    },
    bookmarkContainer: {
      width: horizontalScale(37),
      height: horizontalScale(37),
      backgroundColor: "#0A1517B2",
      marginEnd: horizontalScale(12),
      marginTop: verticalScale(10),
      borderRadius: horizontalScale(40),
      justifyContent: "center",
      alignItems: "center",
    },
    bookmarkIcon: {
      tintColor: colors.GREEN_YELLOWISH,
      width: horizontalScale(18),
      height: horizontalScale(18),
    },
  });
