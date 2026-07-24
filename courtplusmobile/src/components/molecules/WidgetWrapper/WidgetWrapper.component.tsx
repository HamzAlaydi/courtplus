import React, { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { WidgetWrapperProps } from "./WidgetWrapper.types";
import { useThemeContext } from "contexts";
import styles from "./WidgetWrapper.styles";

const WidgetWrapper = ({
  children,
  onPress,
  disabled,
  overrideStyle,
}: WidgetWrapperProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[themedStyles.container, overrideStyle]}
    >
      {children}
    </TouchableOpacity>
  );
};

export default WidgetWrapper;
