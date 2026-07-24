import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { spacing, verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: 0,
    },
    header: {
      paddingHorizontal: spacing[24],
    },
    locationHeader: {
      paddingHorizontal: spacing[24],
      paddingVertical: verticalScale(13),
      marginTop: verticalScale(24),
      backgroundColor: colors.LIGHT_GREY,
    },
    contentList: {
      paddingHorizontal: spacing[24],
      paddingTop: verticalScale(24),
    },
    resultsContainer: {
      paddingHorizontal: spacing[24],
      marginTop: verticalScale(24),
    },
    resultsText: {
      color: colors.GRAYISH_BLUE,
    },
  });
