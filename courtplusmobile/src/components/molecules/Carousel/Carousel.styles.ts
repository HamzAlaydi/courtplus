import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export const DOT_SIZE = horizontalScale(6);
export const ACTIVE_DOT_WIDTH = horizontalScale(18);

const styles = (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      width: "100%",
      height: verticalScale(185),
    },
    imageContainer: {
      height: verticalScale(185),
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: "100%",
      height: "100%",
      borderRadius: Radius.card,
      overflow: "hidden",
    },
    paginationContainer: {
      position: "absolute",
      bottom: verticalScale(12),
      start: 0,
      end: 0,
      alignItems: "center",
    },
    pagination: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
      paddingHorizontal: spacing[8],
      paddingVertical: spacing[6],
      borderRadius: Radius.pill,
      backgroundColor: colors.GLASS_DARK,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: Radius.pill,
      backgroundColor: colors.WHITE,
    },
    activeDot: {
      backgroundColor: colors.LIME,
    },
  });

export default styles;
