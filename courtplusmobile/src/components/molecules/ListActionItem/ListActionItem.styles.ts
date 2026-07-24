import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.GHOST_WHITE,
      paddingVertical: verticalScale(16),
      borderRadius: spacing[12],
      paddingStart: spacing[34],
    },
    itemContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    itemContainerPadding: {
      paddingBottom: verticalScale(20),
      height: verticalScale(56),
    },

    image: {
      width: horizontalScale(24),
      height: horizontalScale(24),
      marginEnd: spacing[24],
    },
    titleContainer: {
      flex: 1,
    },
    separator: {
      borderBottomColor: colors.LIGHT_GREY,
      borderBottomWidth: 1,
      marginVertical: verticalScale(8.77),
    },
  });
