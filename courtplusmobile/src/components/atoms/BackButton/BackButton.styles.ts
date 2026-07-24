import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { isRTL, spacing } from "utils";

export default (colors: ColorsType, whiteColor: boolean) =>
  StyleSheet.create({
    container: {
      width: spacing[40],
      height: spacing[40],
      backgroundColor: whiteColor ? colors.GHOST_WHITE : colors.DARK_GREEN,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: spacing[40],
    },
    image: {
      tintColor: whiteColor ? colors.BLACK : colors.WHITE,
      transform: [{ scaleX: isRTL ? -1 : 1 }],
    },
  });
