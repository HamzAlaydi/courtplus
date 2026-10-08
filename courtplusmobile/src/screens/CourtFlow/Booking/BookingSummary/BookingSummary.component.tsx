import { useThemeContext } from "contexts";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import styles from "./BookingSummary.styles";
import {
  BookingButtons,
  CourtBookingCard,
  Header,
  PaymentOptionItem,
  Stepper,
  StepperFlow,
} from "molecules/index";
import { CustomText } from "atoms/index";
import { useBookingSummary } from "./BookingSummary.logic";
import { PaymentType } from "models";
import { Images } from "theme";
import { enterRise } from "utils";

const BookingSummaryScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const {
    isSplitPaymentEnabled,
    courtData,
    timeSummary,
    participants,
    formattedTime,
    totalAmountSplitted,
    totalAmount,
    isSplitPaymentSelected,
    isWholePaymentSelected,
    finalAmount,
    onPaymentTypeChange,
    onCreateBooking,
    onCancelPress,
  } = useBookingSummary();

  return (
    <MainWrapper>
      <Header whiteColor title={t("booking.title")} />
      <ScrollView
        contentContainerStyle={themedStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={themedStyles.content}>
          <Stepper flow={StepperFlow.Booking} currentStep={4} />
          <CustomText
            text={t("booking.bookingSummary")}
            font="sectionTitle"
            weight="bold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
          <Animated.View entering={enterRise(0)}>
            <CourtBookingCard
              courtData={courtData!!}
              selectedDate={timeSummary?.date ?? new Date()}
              selectedTime={formattedTime}
              participants={participants ?? []}
            />
          </Animated.View>
          <Animated.View
            entering={enterRise(1)}
            style={themedStyles.paymentOptionsContainer}
            accessibilityRole="radiogroup"
          >
            {isSplitPaymentEnabled ? (
              <>
                <PaymentOptionItem
                  title={t("booking.payPart")}
                  isSelected={isSplitPaymentSelected}
                  onPress={() => onPaymentTypeChange(PaymentType.SPLIT)}
                  amount={Number(totalAmountSplitted)}
                />
                <PaymentOptionItem
                  title={t("booking.payEverything")}
                  isSelected={isWholePaymentSelected}
                  onPress={() => onPaymentTypeChange(PaymentType.WHOLE)}
                  amount={totalAmount}
                />
              </>
            ) : (
              <PaymentOptionItem
                title={t("booking.payEverything")}
                isSelected
                onPress={() => onPaymentTypeChange(PaymentType.WHOLE)}
                amount={totalAmount}
              />
            )}
          </Animated.View>

          <Animated.View
            entering={enterRise(2)}
            style={themedStyles.termsContainer}
          >
            <View style={themedStyles.termsHeader}>
              <Image source={Images.info} style={themedStyles.termsIcon} />
              <CustomText
                text={t("booking.termsAndConditions")}
                font="caption"
                weight="semiBold"
                overrideStyle={themedStyles.termsTitle}
              />
            </View>
            <CustomText
              text={t("booking.termsAndConditionsDescription")}
              font="caption"
              weight="regular"
              overrideStyle={themedStyles.termsText}
            />
            <CustomText
              text={t("booking.cancellationPolicy")}
              font="caption"
              weight="regular"
              overrideStyle={themedStyles.termsText}
            />
          </Animated.View>
        </View>
      </ScrollView>

      <BookingButtons
        onCancelPress={onCancelPress}
        onNextPress={onCreateBooking}
        amount={Number(finalAmount)}
        rightButtonTitle={t("booking.proceedToPay")}
      />
    </MainWrapper>
  );
};

export default BookingSummaryScreen;
