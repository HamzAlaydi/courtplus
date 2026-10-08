import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./AmountDisplay.styles";
import { AmountDisplayProps } from "./AmountDisplay.types";

const AmountDisplay = ({
  amount,
  currency,
  overrideStyle,
}: AmountDisplayProps) => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <CustomText
        text={amount.toString()}
        font="displayNumber"
        weight="bold"
        overrideStyle={themedStyles.amountText}
      />
      <CustomText
        text={currency ?? t("general.currency")}
        font="caption"
        weight="semiBold"
        overrideStyle={themedStyles.text}
      />
    </View>
  );
};

export default AmountDisplay;
