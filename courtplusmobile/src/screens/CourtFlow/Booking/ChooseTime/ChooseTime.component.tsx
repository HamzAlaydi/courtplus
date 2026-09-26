import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import {
  BookingButtons,
  Header,
  HorizontalDatePicker,
  Stepper,
  StepperFlow,
  WidgetWrapper,
} from "molecules/index";
import { MainWrapper, TimeSlots } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./ChooseTime.styles";
import { useChooseTime } from "./ChooseTime.logic";

const ChooseTimeScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const {
    onNextPress,
    courtData,
    selectedDurationMinutes,
    selectedTotalCost,
    hasGapInSelection,
    setSelectedDate,
    slots,
    slotsLoading,
    onTimeSlotPress,
    selectedSlots,
    selectedDate,
    goBack,
    isRightButtonDisabled,
  } = useChooseTime();

  return (
    <View style={themedStyles.container}>
      <MainWrapper
        scrollEnabled
        whiteBackground
        overrideContentStyle={themedStyles.scrollViewContent}
      >
        <Header whiteColor title={t("booking.title")} />
        <View style={themedStyles.content}>
          <Stepper flow={StepperFlow.Booking} currentStep={1} />
          <View style={themedStyles.infoContainer}>
            <View style={themedStyles.infoItem}>
              <CustomText
                text={t("booking.totalSelectedTime")}
                font="chip"
                weight="regular"
              />
              <WidgetWrapper overrideStyle={themedStyles.infoWidget}>
                <Image source={Images.clock} />
                <CustomText
                  text={`${selectedDurationMinutes} ${t("general.mins")}`}
                  font="headline3"
                  weight="semiBold"
                />
              </WidgetWrapper>
            </View>
            <View style={themedStyles.infoItem}>
              <CustomText
                text={t("booking.totalCost")}
                font="chip"
                weight="regular"
              />
              <WidgetWrapper overrideStyle={themedStyles.infoWidget}>
                <CustomText
                  text={`${courtData.currency ?? "SAR"} ${selectedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  font="headline3"
                  weight="semiBold"
                />
              </WidgetWrapper>
            </View>
          </View>
          <HorizontalDatePicker
            overrideContainerStyle={themedStyles.horizontalDatePicker}
            selectedDate={selectedDate}
            onDayPress={setSelectedDate}
          />
          <View style={themedStyles.timezoneContainer}>
            <Image source={Images.timezone} />
            <CustomText
              text={t("booking.courtTime")}
              font="text"
              weight="medium"
            />
          </View>
          {hasGapInSelection && (
            // Explains why Next is disabled; otherwise the button just looks
            // broken after the customer skips a slot.
            <CustomText
              text={t("booking.selectionMustBeContiguous")}
              font="text"
              weight="medium"
              overrideStyle={{ color: "#D4380D", paddingHorizontal: 24 }}
            />
          )}
          <TimeSlots
            overrideStyle={themedStyles.timeSlotsContainer}
            onTimeSlotPress={onTimeSlotPress}
            slots={slots}
            selectedSlots={selectedSlots}
            isLoading={slotsLoading}
          />
        </View>
      </MainWrapper>
      <BookingButtons
        isRightButtonDisabled={isRightButtonDisabled}
        onCancelPress={goBack}
        onNextPress={onNextPress}
      />
    </View>
  );
};

export default ChooseTimeScreen;
