import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    leadingComponent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[8],
    },
    content: {
      paddingTop: verticalScale(22),
      paddingHorizontal: spacing[24],
    },
    name: {
      marginTop: verticalScale(18),
    },
    description: {
      marginTop: verticalScale(18),
    },
    sports: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
      flexWrap: "wrap",
      marginTop: verticalScale(20),
    },
    tabs: {
      marginTop: verticalScale(17),
    },
    tabsContainer: {
      backgroundColor: colors.LIGHT_GREY,
    },
    header: {
      paddingHorizontal: spacing[24],
      gap: 0,
      justifyContent: "space-between",
    },
    username: {
      color: colors.SLATE_GRAY,
    },
    profileImageHeader: {
      paddingHorizontal: horizontalScale(8.5),
      paddingTop: verticalScale(8),
    },
    scrollContent: {
      paddingHorizontal: 0,
      paddingBottom: 0,
    },
    sportContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: verticalScale(8),
      paddingVertical: verticalScale(2),
      backgroundColor: colors.LIGHT_BLUE,
    },
    subtitle: {
      color: colors.SLATE_GRAY,
    },
    sessions: {
      marginTop: verticalScale(18),
    },
  });
