import { CustomText, PressableScale } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./ProfileCard.styles";
import { ProfileCardProps } from "./ProfileCard.types";
import { Gender } from "models";

const ProfileCard = ({
  name,
  username,
  image,
  onAddPress,
  gender,
  overrideStyle,
  rightIcon,
}: ProfileCardProps) => {
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

  return (
    <View style={[themedStyles.container, overrideStyle]}>
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
      {rightIcon ? (
        rightIcon
      ) : (
        <PressableScale
          style={themedStyles.addButton}
          onPress={onAddPress}
          hitSlop={4}
          accessibilityRole="button"
        >
          <Image source={Images.plus} style={themedStyles.icon} />
        </PressableScale>
      )}
    </View>
  );
};

export default ProfileCard;
