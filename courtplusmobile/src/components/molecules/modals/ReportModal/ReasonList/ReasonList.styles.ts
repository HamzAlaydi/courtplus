import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, isRTL, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      paddingTop: verticalScale(18),
    },
    group: {
      backgroundColor: colors.SUBTLE,
      borderRadius: Radius.tile,
      paddingHorizontal: spacing[14],
    },
    listContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[12],
      minHeight: verticalScale(54),
      paddingVertical: verticalScale(10),
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.DIVIDER,
    },
    title: {
      flex: 1,
      color: colors.INK,
    },
    arrowIcon: {
      width: horizontalScale(14),
      height: horizontalScale(14),
      resizeMode: "contain",
      tintColor: colors.FAINT,
      transform: [{ scaleX: isRTL ? 1 : -1 }],
    },
  });
