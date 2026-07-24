import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.WHITE,
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(13),
      borderRadius: spacing[12],
      paddingStart: horizontalScale(7),
      paddingEnd: horizontalScale(9),
    },
    invitation: {
      justifyContent: "space-between",
      flexDirection: "row",
      paddingHorizontal: horizontalScale(3),
      alignItems: "center",
    },
    description: {
      color: colors.SLATE_GRAY,
    },
    buttonsRow: {
      marginTop: verticalScale(10.21),
    },
    dottedContainer: {
      marginTop: verticalScale(17),
    },
    participantsContainer: {
      flexDirection: "row",
      gap: horizontalScale(24),
      alignItems: "center",
      paddingStart: spacing[10],
    },
  });
