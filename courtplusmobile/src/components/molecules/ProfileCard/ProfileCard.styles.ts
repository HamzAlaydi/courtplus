import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      borderColor: colors.LIGHT_GREY,
      borderWidth: 1,
      paddingHorizontal: spacing[12],
      paddingVertical: spacing[12],
      marginTop: verticalScale(20),
      borderRadius: spacing[8],
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    profileContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[12],
    },
    addButton: {
      width: spacing[40],
      height: spacing[40],
      backgroundColor: `${colors.MED_GREEN}08`,
      borderRadius: spacing[40],
      justifyContent: "center",
      alignItems: "center",
    },
    addButtonIcon: {
      width: spacing[20],
      height: spacing[20],
      borderColor: `${colors.MED_GREEN}29`,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: spacing[6],
      padding: spacing[10],
    },
    username: {
      color: colors.GREY,
      width: horizontalScale(199),
    },
    icon: {
      tintColor: colors.MED_GREEN,
    },
    image: {
      width: spacing[40],
      height: spacing[40],
      borderRadius: spacing[40],
    },
  });
