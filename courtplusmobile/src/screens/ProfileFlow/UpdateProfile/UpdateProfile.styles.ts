import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { horizontalScale, spacing, verticalScale } from "utils";
import { AVATAR_SIZE } from "molecules/ProfileImage/ProfileImage.styles";

export default (colors: ColorsType) =>
  StyleSheet.create({
    profileImageHeader: {
      paddingTop: verticalScale(12),
    },
    save: {
      minHeight: verticalScale(40),
      paddingHorizontal: spacing[18],
    },
    content: {
      paddingBottom: verticalScale(40),
    },
    mainContent: {
      marginTop: AVATAR_SIZE / 2 + verticalScale(20),
    },
    fullName: {
      marginTop: 0,
    },
    username: {
      marginTop: verticalScale(14),
    },
    dateOfBirthContainer: {
      marginTop: verticalScale(14),
      flexDirection: "row",
      gap: horizontalScale(10),
    },
    flexOne: {
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.LINE,
      marginTop: verticalScale(24),
    },
    bio: {
      marginTop: verticalScale(14),
    },
  });
