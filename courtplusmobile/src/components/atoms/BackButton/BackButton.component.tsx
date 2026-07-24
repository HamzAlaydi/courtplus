import { useNavigation } from "@react-navigation/native";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, TouchableOpacity } from "react-native";
import { Images } from "theme";
import styles from "./BackButton.styles";
import { BackButtonProps } from "./BackButton.types";

const BackButton = ({
  whiteColor = false,
  overrideStyle,
  iconStyle,
}: BackButtonProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const { goBack } = useNavigation();
  const themedStyles = useMemo(
    () => styles(colors, whiteColor),
    [colors, whiteColor]
  );

  return (
    <TouchableOpacity
      style={[themedStyles.container, overrideStyle]}
      onPress={goBack}
    >
      <Image
        source={Images.arrowLeft}
        style={[themedStyles.image, iconStyle]}
      />
    </TouchableOpacity>
  );
};

export default BackButton;
