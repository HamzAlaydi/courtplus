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
        text={currency ?? t("general.currency")}
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
