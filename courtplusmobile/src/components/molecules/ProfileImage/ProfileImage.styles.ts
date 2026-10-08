import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale } from "utils";

export const AVATAR_SIZE = horizontalScale(100);
const RING = horizontalScale(4);
const CAMERA_SIZE = horizontalScale(34);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: -AVATAR_SIZE / 2,
      start: 0,
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      padding: RING,
      backgroundColor: colors.CARD,
      ...Shadows.card,
    },
    image: {
      width: AVATAR_SIZE - RING * 2,
      height: AVATAR_SIZE - RING * 2,
      borderRadius: (AVATAR_SIZE - RING * 2) / 2,
      backgroundColor: colors.DIVIDER,
    },
    cameraContainer: {
      position: "absolute",
      bottom: 0,
      end: 0,
      width: CAMERA_SIZE,
      height: CAMERA_SIZE,
      borderRadius: Radius.pill,
      borderWidth: 3,
      borderColor: colors.CARD,
      backgroundColor: colors.LIME,
      justifyContent: "center",
      alignItems: "center",
    },
    cameraIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
  });
