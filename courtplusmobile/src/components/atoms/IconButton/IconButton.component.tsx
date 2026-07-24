import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import styles from "./IconButton.styles";
import { IconButtonProps } from "./IconButton.types";
import CustomText from "atoms/CustomText/CustomText.component";

const IconButton = ({
  icon,
  title,
  onPress,
  overrideStyle,
  overrideIconStyle,
}: IconButtonProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[themedStyles.container, overrideStyle]}
    >
      <Image source={icon} style={[themedStyles.icon, overrideIconStyle]} />
      <CustomText text={title} font="headline3" weight="semiBold" />
    </TouchableOpacity>
  );
};

export default IconButton;
