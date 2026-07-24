import { useThemeContext } from "contexts";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import styles from "./BookingSummary.styles";
import {
  BookingButtons,
  CourtBookingCard,
  DottedContainer,
  Header,
  PaymentOptionItem,
  Stepper,
  StepperFlow,
} from "molecules/index";
import { CustomText } from "atoms/index";
import { useBookingSummary } from "./BookingSummary.logic";
import { PaymentType } from "models";

const BookingSummaryScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const {
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
    <MainWrapper whiteBackground>
      <Header whiteColor title={t("booking.title")} />
      <ScrollView
        contentContainerStyle={themedStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={themedStyles.content}>
          <Stepper flow={StepperFlow.Booking} currentStep={4} />
          <CustomText
            text={t("booking.bookingSummary")}
            font="headline3"
            weight="regular"
            overrideStyle={themedStyles.title}
          />
          <CourtBookingCard
            courtData={courtData!!}
            selectedDate={timeSummary?.date ?? new Date()}
            selectedTime={formattedTime}
            participants={participants ?? []}
          />
          <View style={themedStyles.paymentOptionsContainer}>
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
          </View>

          <DottedContainer overrideStyle={themedStyles.termsContainer}>
            <CustomText text={t("booking.termsAndConditionsDescription")} />
          </DottedContainer>
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
