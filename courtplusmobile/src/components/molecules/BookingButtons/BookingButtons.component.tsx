import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "./BookingButtons.styles";
import { useTranslation } from "react-i18next";
import { BookingButtonsProps } from "./BookingButtons.types";
import { verticalScale } from "utils";

const BookingButtons = ({
  onCancelPress,
  onNextPress,
  amount,
  rightButtonTitle,
  isRightButtonDisabled = false,
  totalLabel,
  totalValue,
  totalUnit,
}: BookingButtonsProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const buttonTitle = rightButtonTitle || t("general.next");
  const displayValue = totalValue ?? (amount ? amount.toString() : undefined);
  const summaryLabel =
    totalLabel ?? `${t("general.total")} · ${t("booking.taxes")}`;
  const paddingBottom =
    bottom > 0 ? bottom + verticalScale(4) : verticalScale(16);

  return (
    <View style={[themedStyles.container, { paddingBottom }]}>
      {displayValue !== undefined && (
        <View style={themedStyles.summaryRow}>
          <CustomText
            font="caption"
            weight="medium"
            text={summaryLabel}
            numberOfLines={2}
            overrideStyle={themedStyles.summaryLabel}
          />
          <View style={themedStyles.amountRow}>
            <CustomText
              font="displayNumber"
              weight="extraBold"
              text={displayValue}
              overrideStyle={themedStyles.amount}
            />
            <CustomText
              font="caption"
              weight="medium"
              text={totalUnit ?? t("general.currency")}
              overrideStyle={themedStyles.amountUnit}
            />
          </View>
        </View>
      )}
      <View style={themedStyles.buttonsContainer}>
        <CustomButton
          title={t("general.cancel")}
          onPress={onCancelPress}
          variant="outline"
          overrideStyle={themedStyles.button}
        />
        <CustomButton
          title={buttonTitle}
          variant={isRightButtonDisabled ? "disabledDark" : "primary"}
          onPress={onNextPress}
          disabled={isRightButtonDisabled}
          overrideStyle={[themedStyles.button, themedStyles.nextButton]}
        />
      </View>
    </View>
  );
};

export default BookingButtons;
