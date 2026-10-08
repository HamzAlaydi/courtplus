import React, { useMemo } from "react";
import { View } from "react-native";
import { CardProps } from "./Card.types";
import { useThemeContext } from "contexts";
import styles from "./Card.styles";
import PressableScale from "atoms/PressableScale/PressableScale.component";

const Card = ({ children, overrideStyle, disabled, onPress }: CardProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  if (!onPress) {
    return (
      <View style={[themedStyles.container, overrideStyle]}>{children}</View>
    );
  }

  return (
    <PressableScale
      disabled={disabled}
      onPress={onPress}
      style={[themedStyles.container, overrideStyle]}
    >
      {children}
    </PressableScale>
  );
};

export default Card;
