import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.CARD,
      borderColor: colors.LINE,
      borderWidth: 1,
      padding: spacing[10],
      paddingEnd: spacing[12],
      marginTop: verticalScale(10),
      borderRadius: Radius.tile,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing[12],
    },
    profileContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    textContainer: {
      flex: 1,
      gap: verticalScale(2),
    },
    addButton: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      backgroundColor: colors.LIME,
      borderRadius: Radius.pill,
      justifyContent: "center",
      alignItems: "center",
    },
    username: {
      color: colors.MUTED,
    },
    icon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    image: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: Radius.pill,
      backgroundColor: colors.DIVIDER,
    },
  });
