import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { CardProps } from "./Card.types";
import { useThemeContext } from "contexts";
import styles from "./Card.styles";

const Card = ({ children, overrideStyle, disabled, onPress }: CardProps) => {
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

export default Card;
