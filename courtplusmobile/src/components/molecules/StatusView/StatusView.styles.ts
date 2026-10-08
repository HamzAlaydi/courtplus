import { StyleSheet } from "react-native";
import { ColorsType, Layout, Shadows } from "theme";
import { horizontalScale, verticalScale } from "utils";

const IMAGE_SIZE = horizontalScale(128);
const RING_SIZE = horizontalScale(152);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.GROUND,
      paddingHorizontal: Layout.gutter,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: verticalScale(36),
    },
    imageRing: {
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: RING_SIZE / 2,
      backgroundColor: colors.CARD,
      alignItems: "center",
      justifyContent: "center",
      ...Shadows.raised,
    },
    image: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: IMAGE_SIZE / 2,
      backgroundColor: colors.DIVIDER,
    },
    secondImage: {
      position: "absolute",
      end: horizontalScale(4),
      bottom: horizontalScale(4),
    },
    title: {
      textAlign: "center",
    },
  });
