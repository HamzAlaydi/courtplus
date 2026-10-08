import React, { useMemo, useState } from "react";
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
  View,
} from "react-native";
import { TextAreaProps } from "./TextArea.types";
import CustomText from "atoms/CustomText/CustomText.component";
import { useThemeContext } from "contexts";
import styles from "./TextArea.styles";

const TextArea = ({
  label,
  overrideStyle,
  overrideWrapperStyle,
  onFocus,
  onBlur,
  ...props
}: TextAreaProps) => {
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
    <View style={overrideStyle}>
      {label && (
        <CustomText
          text={label}
          font="caption"
          weight="medium"
          overrideStyle={themedStyles.label}
        />
      )}
      <View
        style={[
          themedStyles.container,
          isFocused && themedStyles.focused,
          overrideWrapperStyle,
        ]}
      >
        <TextInput
          {...props}
          multiline
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={themedStyles.input}
          placeholderTextColor={colors.MUTED}
          selectionColor={colors.INK}
        />
        {props.maxLength && (
          <View style={themedStyles.counterContainer}>
            <CustomText
              font="caption"
              weight="regular"
              overrideStyle={themedStyles.counter}
              text={`${props.value?.length ?? 0}/${props.maxLength}`}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default TextArea;
