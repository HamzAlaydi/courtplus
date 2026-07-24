import React, { useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { ActionIconProps } from "./ActionIcon.types";
import { useThemeContext } from "contexts";
import styles from "./ActionIcon.styles";
import { Images } from "theme";

const ActionIcon = ({ icon, onPress, overrideStyle }: ActionIconProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[themedStyles.container, overrideStyle]}
      onPress={onPress}
    >
      <Image source={Images[icon]} />
    </TouchableOpacity>
  );
};

export default ActionIcon;
