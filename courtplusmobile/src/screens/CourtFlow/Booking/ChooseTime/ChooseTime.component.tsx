import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import {
  BookingButtons,
  Header,
  HorizontalDatePicker,
  Stepper,
  StepperFlow,
} from "molecules/index";
import { MainWrapper, TimeSlots } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import { enterFade, enterRise, getCourtImage } from "utils";
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

  const currency = courtData.currency ?? "SAR";
  const formattedTotalCost = selectedTotalCost.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={themedStyles.container}>
      <MainWrapper
        scrollEnabled
        overrideContentStyle={themedStyles.scrollViewContent}
      >
        <Header whiteColor title={t("booking.title")} />
        <View style={themedStyles.content}>
          <Stepper flow={StepperFlow.Booking} currentStep={1} />
          <Animated.View
            entering={enterRise(0)}
            style={themedStyles.courtSummary}
          >
            <Image
              source={getCourtImage(courtData)}
              style={themedStyles.courtImage}
            />
            <View style={themedStyles.courtInfo}>
              <CustomText
                text={courtData.name ?? ""}
                font="cardTitle"
                weight="semiBold"
                numberOfLines={1}
                overrideStyle={themedStyles.courtName}
              />
              {!!courtData.branch?.name && (
                <CustomText
                  text={courtData.branch.name}
                  font="caption"
                  weight="regular"
                  numberOfLines={1}
                  overrideStyle={themedStyles.mutedText}
                />
              )}
            </View>
            <View style={themedStyles.rateRow}>
              <CustomText
                text={`${courtData.hourlyRate ?? 0}`}
                font="displayNumber"
                weight="bold"
                overrideStyle={themedStyles.rateValue}
              />
              <CustomText
                text={`${currency} ${t("general.perHour", {
                  defaultValue: "/ hr",
                })}`}
                font="caption"
                weight="medium"
                overrideStyle={themedStyles.mutedText}
              />
            </View>
          </Animated.View>
          <Animated.View entering={enterRise(1)}>
            <HorizontalDatePicker
              selectedDate={selectedDate}
              onDayPress={setSelectedDate}
            />
          </Animated.View>
          <View style={themedStyles.timezoneContainer}>
            <Image source={Images.timezone} style={themedStyles.timezoneIcon} />
            <CustomText
              text={t("booking.courtTime")}
              font="caption"
              weight="regular"
              overrideStyle={themedStyles.timezoneText}
            />
          </View>
          {hasGapInSelection && (
            // Explains why Next is disabled; otherwise the button just looks
            // broken after the customer skips a slot.
            <Animated.View
              entering={enterFade()}
              style={themedStyles.gapNotice}
              accessibilityLiveRegion="polite"
            >
              <View style={themedStyles.gapNoticeDot} />
              <CustomText
                text={t("booking.selectionMustBeContiguous")}
                font="caption"
                weight="semiBold"
                overrideStyle={themedStyles.gapNoticeText}
              />
            </Animated.View>
          )}
          <TimeSlots
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
        totalLabel={`${t("booking.totalCost")} · ${selectedDurationMinutes} ${t(
          "general.mins"
        )}`}
        totalValue={formattedTotalCost}
        totalUnit={currency}
      />
    </View>
  );
};

export default ChooseTimeScreen;
