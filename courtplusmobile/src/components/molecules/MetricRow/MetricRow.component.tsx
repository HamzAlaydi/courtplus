import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { View } from "react-native";
import styles from "./MetricRow.styles";
import { CustomText } from "atoms/index";
import { MetricRowProps } from "./MetricRow.types";

const MetricRow = ({
  leftValue,
  rightValue,
  overrideStyle,
  onLeftValuePress,
  onRightValuePress,
}: MetricRowProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <CustomText
        onPress={onLeftValuePress}
        text={leftValue}
        font="chip"
        weight="semiBold"
      />
      <View style={themedStyles.dot} />
      <CustomText
        onPress={onRightValuePress}
        text={rightValue}
        font="chip"
        weight="semiBold"
      />
    </View>
  );
};

export default MetricRow;
