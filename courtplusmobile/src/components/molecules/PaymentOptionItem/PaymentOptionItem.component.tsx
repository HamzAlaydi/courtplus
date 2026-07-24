import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Images } from "theme";
import styles from "./PaymentOptionItem.styles";
import { PaymentOptionItemProps } from "./PaymentOptionItem.types";
import { useTranslation } from "react-i18next";

const PaymentOptionItem = ({
  isSelected,
  onPress,
  overrideStyle,
  title,
  amount,
  disabled = false,
}: PaymentOptionItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <View style={themedStyles.rowContainer}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          style={themedStyles.radioContainer}
        >
          {isSelected && <View style={themedStyles.radio} />}
        </TouchableOpacity>
        <View style={themedStyles.cardContainer}>
          <Image source={Images.card} />
          <CustomText font="headline3" weight="medium" text={title} />
        </View>
      </View>
      <View style={themedStyles.amountContainer}>
        <CustomText
          font="text"
          weight="semiBold"
          text={t("general.currency")}
          overrideStyle={themedStyles.amountText}
        />
        <CustomText font="body" weight="semiBold" text={amount.toString()} />
      </View>
    </View>
  );
};

export default PaymentOptionItem;
