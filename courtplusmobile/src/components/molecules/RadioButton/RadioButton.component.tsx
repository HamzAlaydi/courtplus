import { CustomText } from "atoms/index";
import React, { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { RadioButtonProps } from "./RadioButton.types";
import { useThemeContext } from "contexts";
import styles from "./RadioButton.styles";

const RadioButton = ({
  title,
  isSelected,
  onPress,
  overrideStyle,
  isDark = false,
}: RadioButtonProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors, isDark), [colors]);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[themedStyles.container, overrideStyle]}
    >
      <CustomText
        font="headline3"
        weight="medium"
        text={title}
        overrideStyle={themedStyles.title}
      />
      <View style={themedStyles.radio}>
        {isSelected && <View style={[themedStyles.selected]} />}
      </View>
    </TouchableOpacity>
  );
};

export default RadioButton;
