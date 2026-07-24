import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
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
      {rightIcon ? (
        rightIcon
      ) : (
        <TouchableOpacity style={themedStyles.addButton} onPress={onAddPress}>
          <View style={themedStyles.addButtonIcon}>
            <Image source={Images.plus} style={themedStyles.icon} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProfileCard;
