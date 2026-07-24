import React, { useMemo } from "react";
import { View } from "react-native";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./AmountDisplay.styles";
import { AmountDisplayProps } from "./AmountDisplay.types";

const AmountDisplay = ({ amount, overrideStyle }: AmountDisplayProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <CustomText
        text="SAR"
        font="text"
        weight="semiBold"
        overrideStyle={themedStyles.text}
      />
      <CustomText
        text={amount.toString()}
        font="headline2"
        weight="semiBold"
        overrideStyle={themedStyles.amountText}
      />
    </View>
  );
};

export default AmountDisplay;
