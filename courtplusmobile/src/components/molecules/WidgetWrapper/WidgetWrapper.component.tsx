import React, { useMemo } from "react";
import { View } from "react-native";
import { WidgetWrapperProps } from "./WidgetWrapper.types";
import { useThemeContext } from "contexts";
import styles from "./WidgetWrapper.styles";
import { PressableScale } from "atoms/index";

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

  if (!onPress || disabled) {
    return (
      <View style={[themedStyles.container, overrideStyle]}>{children}</View>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      style={[themedStyles.container, overrideStyle]}
    >
      {children}
    </PressableScale>
  );
};

export default WidgetWrapper;
