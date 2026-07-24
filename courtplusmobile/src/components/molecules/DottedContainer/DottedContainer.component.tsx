import React, { useMemo } from "react";
import { View } from "react-native";
import { DottedContainerProps } from "./DottedContainer.types";
import { useThemeContext } from "contexts";
import styles from "./DottedContainer.styles";

const DottedContainer = ({ children, overrideStyle }: DottedContainerProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <View style={[themedStyles.container, overrideStyle]}>{children}</View>
  );
};

export default DottedContainer;
