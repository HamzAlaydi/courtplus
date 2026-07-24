import React from "react";
import { CustomButton, CustomText } from "atoms/index";
import { Image, TouchableOpacity, View } from "react-native";
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

  const button = useMemo(() => {
    if (isFollowing) {
      return {
        title: "Unfollow",
        onPress: onUnfollow,
      };
    }
    if (isFollowed) {
      return {
        title: "Follow Back",
        onPress: onFollow,
      };
    }
    return {
      title: "Follow",
      onPress: onFollow,
    };
  }, [isFollowing, isFollowed, onFollow, onUnfollow]);

  return (
    <TouchableOpacity onPress={onPress} style={themedStyles.container}>
      <View style={themedStyles.profileContainer}>
        <Image source={renderIcon()} style={themedStyles.image} />
        <View>
          <CustomText text={name} font="headline3" weight="semiBold" />
          {username && (
            <CustomText
              text={`@${username}`}
              font="headline3"
              weight="medium"
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
          variant="active"
          overrideStyle={themedStyles.button}
          overrideTextStyle={themedStyles.buttonText}
        />
      )}
    </TouchableOpacity>
  );
};

export default UserFollowRow;
