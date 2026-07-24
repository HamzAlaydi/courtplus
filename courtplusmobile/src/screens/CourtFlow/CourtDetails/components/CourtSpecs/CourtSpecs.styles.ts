import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const styles = (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      marginTop: verticalScale(24),
      paddingHorizontal: horizontalScale(24),
    },
    whiteContainer: {
      backgroundColor: colors.WHITE,
      paddingBottom: verticalScale(24),
    },
    image: {
      width: "100%",
      height: verticalScale(218),
    },
    whiteContainerContent: {
      paddingHorizontal: horizontalScale(24),
      paddingTop: verticalScale(11),
    },
    whiteContainerContentItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: verticalScale(13),
    },
    specsImage: {
      width: spacing[24],
      height: spacing[24],
      tintColor: colors.GREY,
    },
    specsItemContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
  });

export default styles;
