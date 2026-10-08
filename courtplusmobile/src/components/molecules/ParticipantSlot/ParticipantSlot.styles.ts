import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, moderateScale, spacing, verticalScale } from "utils";

const AVATAR_SIZE = horizontalScale(48);
const RING_SIZE = horizontalScale(54);

export default (colors: ColorsType) =>
  StyleSheet.create({
    availableContainer: {
      width: horizontalScale(64),
      gap: verticalScale(6),
      alignItems: "center",
    },
    container: {
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: Radius.pill,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.HANDLE,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.FAINT,
    },
    ring: {
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME,
    },
    image: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: Radius.pill,
      borderWidth: 2,
      borderColor: colors.CARD,
      backgroundColor: colors.DIVIDER,
    },
    labels: {
      width: "100%",
      alignItems: "center",
    },
    availableText: {
      color: colors.MUTED,
      textAlign: "center",
    },
    name: {
      color: colors.INK,
      textAlign: "center",
      maxWidth: "100%",
    },
    username: {
      color: colors.MUTED,
      textAlign: "center",
      maxWidth: "100%",
      fontSize: moderateScale(11),
      lineHeight: moderateScale(15),
    },
    usernamePlaceholder: {
      height: moderateScale(15),
    },
    closeIcon: {
      width: horizontalScale(8),
      height: horizontalScale(8),
      resizeMode: "contain",
      tintColor: colors.WHITE,
    },
    closeButton: {
      position: "absolute",
      top: -spacing[2],
      end: spacing[2],
      width: horizontalScale(22),
      height: horizontalScale(22),
      borderRadius: Radius.pill,
      backgroundColor: colors.DANGER,
      borderWidth: 2,
      borderColor: colors.CARD,
      justifyContent: "center",
      alignItems: "center",
    },
  });
