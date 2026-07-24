import React, { useMemo } from "react";
import { TextInput, View } from "react-native";
import { useThemeContext } from "contexts";
import styles from "./Input.styles";
import { InputProps } from "./Input.types";

const Input = ({ overrideStyle, leftComponent, ...props }: InputProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <View style={[themedStyles.container, overrideStyle]}>
      {leftComponent && <View>{leftComponent}</View>}
      <TextInput
        {...props}
        placeholderTextColor={colors.GRAYISH_BLUE}
        style={themedStyles.input}
      />
    </View>
  );
};

export default Input;
