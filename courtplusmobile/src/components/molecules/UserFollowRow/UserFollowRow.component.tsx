import { useTranslation } from "react-i18next";
import React from "react";
import { CustomButton, CustomText, PressableScale } from "atoms/index";
import { Image, View } from "react-native";
import { UserFollowRowProps } from "./UserFollowRow.types";
import { useThemeContext } from "contexts";
import { useMemo } from "react";
import styles from "./UserFollowRow.styles";
import { Gender } from "models";
import { Images } from "theme";

const UserFollowRow = ({
  name,
  username,
  image,
  onPress,
  gender,
  isFollowed,
  isFollowing,
  onFollow,
  onUnfollow,
  showButton = true,
}: UserFollowRowProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();

  const themedStyles = useMemo(() => styles(colors), [colors]);

  const renderIcon = () => {
    if (image) {
      return { uri: image };
    }
    if (gender === Gender.MALE) {
      return Images.maleProfile;
    }
    return Images.femaleProfile;
  };

  const { t } = useTranslation();
  const button = useMemo(() => {
    if (isFollowing) {
      return {
        title: t("profile.unfollow"),
        onPress: onUnfollow,
        variant: "outline" as const,
      };
    }
    if (isFollowed) {
      return {
        title: t("notifications.followBack"),
        onPress: onFollow,
        variant: "secondary" as const,
      };
    }
    return {
      title: t("profile.follow"),
      onPress: onFollow,
      variant: "secondary" as const,
    };
  }, [isFollowing, isFollowed, onFollow, onUnfollow, t]);

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      style={themedStyles.container}
    >
      <View style={themedStyles.profileContainer}>
        <Image source={renderIcon()} style={themedStyles.image} />
        <View style={themedStyles.textContainer}>
          <CustomText
            text={name}
            font="cardTitle"
            weight="semiBold"
            numberOfLines={1}
          />
          {username && (
            <CustomText
              text={`@${username}`}
              font="caption"
              weight="regular"
              overrideStyle={themedStyles.username}
              numberOfLines={1}
            />
          )}
        </View>
      </View>
      {showButton && (
        <CustomButton
          title={button.title}
          onPress={button.onPress}
          variant={button.variant}
          size="small"
          overrideStyle={themedStyles.button}
          overrideTextStyle={themedStyles.buttonText}
        />
      )}
    </PressableScale>
  );
};

export default UserFollowRow;
