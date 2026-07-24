import { Platform, StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

const shadowing = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  android: {
    elevation: 5,
  },
});

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.WHITE,
      paddingHorizontal: spacing[6],
      paddingTop: verticalScale(11),
      paddingBottom: verticalScale(11),
      borderRadius: spacing[12],
      ...shadowing,
    },
  });
