import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image } from "react-native";
import styles from "./IconButton.styles";
import { IconButtonProps } from "./IconButton.types";
import CustomText from "atoms/CustomText/CustomText.component";
import PressableScale from "atoms/PressableScale/PressableScale.component";

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
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      style={[themedStyles.container, overrideStyle]}
    >
      <Image source={icon} style={[themedStyles.icon, overrideIconStyle]} />
      <CustomText
        text={title}
        font="headline3"
        weight="semiBold"
        numberOfLines={1}
        overrideStyle={themedStyles.title}
      />
    </PressableScale>
  );
};

export default IconButton;
