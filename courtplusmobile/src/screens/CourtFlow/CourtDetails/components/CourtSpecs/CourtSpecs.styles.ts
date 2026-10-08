import { StyleSheet } from "react-native";
import { ColorsType, Layout, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const styles = (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: Layout.gutter,
      paddingBottom: verticalScale(8),
      gap: verticalScale(14),
    },
    image: {
      width: "100%",
      height: verticalScale(170),
      borderRadius: Radius.card,
      backgroundColor: colors.DIVIDER,
    },
    list: {
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.tile,
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(4),
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
      minHeight: verticalScale(60),
      paddingVertical: verticalScale(8),
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.DIVIDER,
    },
    iconTile: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: Radius.medium,
      backgroundColor: colors.CARD,
      alignItems: "center",
      justifyContent: "center",
    },
    specsImage: {
      width: horizontalScale(20),
      height: horizontalScale(20),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    title: {
      flex: 1,
      color: colors.MUTED,
    },
    value: {
      color: colors.INK,
      flexShrink: 1,
      textAlign: "right",
    },
    pill: {
      paddingHorizontal: spacing[10],
      paddingVertical: verticalScale(4),
      borderRadius: Radius.pill,
      backgroundColor: colors.LIME_TINT,
      flexShrink: 1,
    },
    pillText: {
      color: colors.LIME_TINT_TEXT,
    },
  });

export default styles;
