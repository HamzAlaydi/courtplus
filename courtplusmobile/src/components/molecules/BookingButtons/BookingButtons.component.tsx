import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { View } from "react-native";
import styles from "./BookingButtons.styles";
import { useTranslation } from "react-i18next";
import { BookingButtonsProps } from "./BookingButtons.types";

const BookingButtons = ({
  onCancelPress,
  onNextPress,
  amount,
  rightButtonTitle,
  isRightButtonDisabled = false,
}: BookingButtonsProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const buttonTitle = rightButtonTitle || t("general.next");

  return (
    <View style={themedStyles.container}>
      {amount && (
        <View style={themedStyles.amountContainer}>
          <View>
            <CustomText
              font="body"
              weight="semiBold"
              text="TOTAL"
              overrideStyle={themedStyles.total}
            />
            <CustomText
              font="text"
              weight="medium"
              text="Including taxes"
              overrideStyle={themedStyles.total}
            />
          </View>
          <CustomText
            font="headline1"
            weight="semiBold"
            text={`${t("general.currency")} ${amount.toString()}`}
            overrideStyle={themedStyles.amount}
          />
        </View>
      )}
      <View style={themedStyles.buttonsContainer}>
        <CustomButton
          title={t("general.cancel")}
          onPress={onCancelPress}
          variant="bordered"
          overrideStyle={[themedStyles.button, themedStyles.cancelButton]}
          overrideTextStyle={themedStyles.cancelButtonText}
        />
        <CustomButton
          title={buttonTitle}
          variant={isRightButtonDisabled ? "disabledDark" : "dark"}
          onPress={onNextPress}
          disabled={isRightButtonDisabled}
          overrideStyle={themedStyles.button}
        />
      </View>
    </View>
  );
};

export default BookingButtons;
