import { Dimensions, StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const { width } = Dimensions.get("window");

const styles = (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      width: "100%",
      height: verticalScale(185),
    },
    imageContainer: {
      width,
      height: verticalScale(185),
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: horizontalScale(327),
      height: "100%",
      borderRadius: spacing[12],
    },
    paginationContainer: {
      position: "absolute",
      bottom: verticalScale(16),
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: horizontalScale(8),
    },
    dot: {
      width: spacing[6],
      height: spacing[6],
      borderRadius: spacing[40],
      backgroundColor: `${colors.BACKGROUND}1F`,
    },
    activeDot: {
      backgroundColor: colors.GREEN_YELLOWISH,
    },
  });

export default styles;
