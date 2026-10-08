import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { View, Image } from "react-native";
import styles from "./ProfileImage.styles";
import { Images } from "theme";
import { ProfileImageProps } from "./ProfileImage.types";
import { PressableScale } from "atoms/index";

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
        <PressableScale
          style={themedStyles.cameraContainer}
          onPress={onPress}
          hitSlop={6}
          accessibilityRole="button"
        >
          <Image source={Images.photo} style={themedStyles.cameraIcon} />
        </PressableScale>
      )}
    </View>
  );
};

export default ProfileImage;
