import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    sportsLevelTitle: {
      color: colors.INK,
      marginTop: verticalScale(22),
      marginBottom: verticalScale(12),
    },
    list: {
      gap: verticalScale(10),
    },
    sportsLevelContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      paddingVertical: verticalScale(10),
      paddingStart: spacing[10],
      paddingEnd: spacing[10],
    },
    iconContainer: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: horizontalScale(20),
      backgroundColor: colors.LIME_TINT,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.LIME_TINT_TEXT,
    },
    textContainer: {
      flex: 1,
    },
    level: {
      color: colors.MUTED,
    },
    deleteButton: {
      width: horizontalScale(36),
      height: horizontalScale(36),
      borderRadius: horizontalScale(18),
      backgroundColor: colors.DANGER_BG,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteIcon: {
      width: horizontalScale(18),
      height: horizontalScale(18),
      resizeMode: "contain",
      tintColor: colors.DANGER,
    },
    addSportContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      paddingVertical: verticalScale(10),
      paddingStart: spacing[10],
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.HANDLE,
      borderRadius: Radius.tile,
    },
    addIconContainer: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: horizontalScale(20),
      backgroundColor: colors.CARD,
      borderWidth: 1,
      borderColor: colors.LINE,
      alignItems: "center",
      justifyContent: "center",
    },
    addIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    addGameText: {
      color: colors.INK,
    },
  });
