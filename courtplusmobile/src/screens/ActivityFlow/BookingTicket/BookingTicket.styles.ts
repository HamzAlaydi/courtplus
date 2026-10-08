import { StyleSheet } from "react-native";
import { ColorsType, Radius, Shadows } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

const NOTCH_SIZE = horizontalScale(28);

export default (colors: ColorsType) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: verticalScale(40),
    },
    pass: {
      marginTop: verticalScale(20),
      backgroundColor: colors.CARD,
      borderRadius: Radius.cardLarge,
      ...Shadows.raised,
    },
    passTop: {
      backgroundColor: colors.INK,
      borderTopLeftRadius: Radius.cardLarge,
      borderTopRightRadius: Radius.cardLarge,
      paddingHorizontal: spacing[20],
      paddingTop: verticalScale(20),
      paddingBottom: verticalScale(22),
      gap: verticalScale(10),
    },
    passTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sportTile: {
      width: horizontalScale(44),
      height: horizontalScale(44),
      borderRadius: horizontalScale(22),
      backgroundColor: colors.LIME,
      alignItems: "center",
      justifyContent: "center",
    },
    sportIcon: {
      width: horizontalScale(22),
      height: horizontalScale(22),
      resizeMode: "contain",
      tintColor: colors.INK,
    },
    sportName: {
      color: colors.WHITE,
      marginTop: verticalScale(4),
    },
    bookingIdContainer: {
      gap: verticalScale(2),
    },
    bookingIdLabel: {
      color: colors.ON_INK_MUTED,
    },
    bookingId: {
      color: colors.WHITE,
    },
    perforation: {
      height: NOTCH_SIZE,
      flexDirection: "row",
      alignItems: "center",
    },
    notch: {
      width: NOTCH_SIZE,
      height: NOTCH_SIZE,
      borderRadius: NOTCH_SIZE / 2,
      backgroundColor: colors.GROUND,
    },
    notchStart: {
      marginStart: -NOTCH_SIZE / 2,
    },
    notchEnd: {
      marginEnd: -NOTCH_SIZE / 2,
    },
    dashedLine: {
      flex: 1,
      height: 1,
      marginHorizontal: spacing[6],
      borderWidth: 1,
      borderRadius: 1,
      borderColor: colors.HANDLE,
      borderStyle: "dashed",
    },
    listContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: spacing[20],
      paddingTop: verticalScale(6),
      paddingBottom: verticalScale(22),
      rowGap: verticalScale(18),
    },
    listItemContainer: {
      width: "50%",
      paddingEnd: spacing[10],
      gap: verticalScale(4),
    },
    listItemFullWidth: {
      width: "100%",
      paddingEnd: 0,
    },
    listItem: {
      color: colors.MUTED,
    },
    listValue: {
      color: colors.INK,
    },
  });
