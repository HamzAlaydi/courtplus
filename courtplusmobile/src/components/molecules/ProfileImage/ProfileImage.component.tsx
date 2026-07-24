import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { View, Image, TouchableOpacity } from "react-native";
import styles from "./ProfileImage.styles";
import { Images } from "theme";
import { ProfileImageProps } from "./ProfileImage.types";

const ProfileImage = ({
  onPress,
  overrideStyle,
  showCamera = true,
  image,
}: ProfileImageProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const finalImage = image ? { uri: image } : Images.maleProfile;
  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <Image source={finalImage} style={themedStyles.image} />
      {showCamera && (
        <TouchableOpacity
          style={themedStyles.cameraContainer}
          onPress={onPress}
        >
          <Image source={Images.photo} style={themedStyles.cameraIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProfileImage;
