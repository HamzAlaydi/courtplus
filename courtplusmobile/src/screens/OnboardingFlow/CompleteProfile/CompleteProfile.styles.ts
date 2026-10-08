import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      paddingBottom: verticalScale(24),
    },
    title: {
      marginTop: verticalScale(20),
    },
    header: {
      marginTop: verticalScale(16),
    },
    fullName: {
      color: colors.INK,
      marginTop: verticalScale(55),
    },
    username: {
      color: colors.MUTED,
      marginTop: verticalScale(2),
    },
    bio: {
      marginTop: verticalScale(24),
    },
    divider: {
      backgroundColor: colors.LINE,
      height: 1,
      width: "100%",
      marginTop: verticalScale(24),
    },
    buttonContainer: {
      flexDirection: "row",
      gap: spacing[10],
      alignItems: "center",
      marginTop: verticalScale(28),
    },
    button: {
      flex: 1,
    },
  });
