import { StyleSheet } from "react-native";
import { ColorsType, Shadows } from "theme";
import { horizontalScale, isRTL } from "utils";

export default (colors: ColorsType, whiteColor: boolean) =>
  StyleSheet.create({
    container: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      backgroundColor: whiteColor ? colors.CARD : colors.DEEP,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: horizontalScale(22),
      ...(whiteColor ? Shadows.subtle : {}),
    },
    image: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: whiteColor ? colors.INK : colors.WHITE,
      transform: [{ scaleX: isRTL ? -1 : 1 }],
    },
  });
