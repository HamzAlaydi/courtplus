import React, { useMemo, useState } from "react";
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
  View,
} from "react-native";
import { useThemeContext } from "contexts";
import styles from "./Input.styles";
import { InputProps } from "./Input.types";

const Input = ({
  overrideStyle,
  leftComponent,
  onFocus,
  onBlur,
  ...props
}: InputProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View
      style={[
        themedStyles.container,
        isFocused && themedStyles.focused,
        overrideStyle,
      ]}
    >
      {leftComponent && <View>{leftComponent}</View>}
      <TextInput
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={colors.MUTED}
        selectionColor={colors.INK}
        style={themedStyles.input}
      />
    </View>
  );
};

export default Input;
