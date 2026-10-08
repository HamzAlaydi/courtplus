import { CustomText, PressableScale } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useEffect, useMemo } from "react";
import { Image, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Images } from "theme";
import { TOGGLE_SPRING } from "utils";
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
  const dotScale = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    dotScale.value = withSpring(isSelected ? 1 : 0, TOGGLE_SPRING);
  }, [isSelected, dotScale]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      disableScale={disabled}
      scaleTo={0.98}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled }}
      style={[
        themedStyles.container,
        isSelected && themedStyles.selectedContainer,
        overrideStyle,
      ]}
    >
      <View style={themedStyles.rowContainer}>
        <View
          style={[
            themedStyles.radioContainer,
            isSelected && themedStyles.radioSelected,
          ]}
        >
          <Animated.View style={[themedStyles.radio, dotStyle]} />
        </View>
        <View style={themedStyles.cardContainer}>
          <View style={themedStyles.cardIconTile}>
            <Image source={Images.card} style={themedStyles.cardIcon} />
          </View>
          <CustomText
            font="headline3"
            weight="semiBold"
            text={title}
            numberOfLines={2}
            overrideStyle={themedStyles.title}
          />
        </View>
      </View>
      <View style={themedStyles.amountContainer}>
        <CustomText
          font="displayNumber"
          weight="bold"
          text={amount.toString()}
          overrideStyle={themedStyles.amount}
        />
        <CustomText
          font="caption"
          weight="medium"
          text={t("general.currency")}
          overrideStyle={themedStyles.amountText}
        />
      </View>
    </PressableScale>
  );
};

export default PaymentOptionItem;
