import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const AVATAR_SIZE = horizontalScale(40);

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      marginTop: verticalScale(18),
    },
    loader: {
      marginTop: verticalScale(18),
    },
    listContent: {
      paddingTop: verticalScale(4),
      paddingBottom: verticalScale(20),
    },
    item: {
      flexDirection: "row",
      gap: spacing[12],
    },
    timeline: {
      width: AVATAR_SIZE,
      alignItems: "center",
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.CARD,
      backgroundColor: colors.DIVIDER,
    },
    timelineLine: {
      flex: 1,
      width: 2,
      marginVertical: verticalScale(4),
      borderRadius: 1,
      backgroundColor: colors.LINE,
    },
    details: {
      flex: 1,
      gap: verticalScale(4),
      marginBottom: verticalScale(14),
      paddingHorizontal: spacing[14],
      paddingVertical: verticalScale(12),
      backgroundColor: colors.CARD,
      borderRadius: Radius.tile,
      borderWidth: 1,
      borderColor: colors.LINE,
    },
    timestamp: {
      color: colors.MUTED,
    },
  });
