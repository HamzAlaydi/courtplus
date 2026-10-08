import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";
import { AVATAR_SIZE } from "molecules/ProfileImage/ProfileImage.styles";

export default (colors: ColorsType) =>
  StyleSheet.create({
    coverWrapper: {
      position: "relative",
    },
    image: {
      width: "100%",
      height: verticalScale(150),
      borderRadius: Radius.card,
      overflow: "hidden",
      backgroundColor: colors.DIVIDER,
    },
    imageStyle: {
      borderRadius: Radius.card,
    },
    cameraOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    cameraContainer: {
      width: horizontalScale(52),
      height: horizontalScale(52),
      borderRadius: Radius.pill,
      backgroundColor: colors.GLASS_DARK,
      justifyContent: "center",
      alignItems: "center",
    },
    cameraIcon: {
      width: horizontalScale(24),
      height: horizontalScale(24),
      resizeMode: "contain",
    },
    profile: {
      start: spacing[16],
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "flex-start",
      gap: spacing[8],
      minHeight: AVATAR_SIZE / 2 + verticalScale(6),
      paddingTop: verticalScale(12),
      paddingStart: AVATAR_SIZE + spacing[24],
    },
    button: {
      minHeight: verticalScale(40),
      paddingHorizontal: spacing[16],
    },
    buttonIcon: {
      width: horizontalScale(16),
      height: horizontalScale(16),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    statsCard: {
      flexDirection: "row",
      alignItems: "stretch",
      marginTop: verticalScale(18),
      paddingVertical: verticalScale(14),
      paddingHorizontal: spacing[6],
      backgroundColor: colors.CARD,
      borderRadius: Radius.card,
      ...Shadows.card,
    },
    statCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      gap: verticalScale(2),
      paddingHorizontal: spacing[4],
    },
    statValue: {
      color: colors.INK,
      textAlign: "center",
    },
    statLabel: {
      color: colors.MUTED,
      textAlign: "center",
    },
    statDivider: {
      width: 1,
      marginVertical: verticalScale(4),
      backgroundColor: colors.DIVIDER,
    },
  });
