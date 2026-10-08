import React, { useMemo } from "react";
import { Image } from "react-native";
import { ActionIconProps } from "./ActionIcon.types";
import { useThemeContext } from "contexts";
import styles from "./ActionIcon.styles";
import { Images } from "theme";
import PressableScale from "atoms/PressableScale/PressableScale.component";

const ActionIcon = ({ icon, onPress, overrideStyle }: ActionIconProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <PressableScale
      style={[themedStyles.container, overrideStyle]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Image source={Images[icon]} style={themedStyles.icon} />
    </PressableScale>
  );
};

export default ActionIcon;
