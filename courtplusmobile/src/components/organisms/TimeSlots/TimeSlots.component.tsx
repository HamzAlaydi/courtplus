import React, { useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { TimeSlotsProps } from "./TimeSlots.type";
import { useTimeSlots } from "./TimeSlots.logic";
import { Slot } from "models";
import { CustomText, SkeletonLoader } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./TimeSlots.styles";
import { Images } from "theme";
import { useTranslation } from "react-i18next";

const TimeSlots = ({
  slots,
  overrideStyle,
  onTimeSlotPress,
  selectedSlots,
  isLoading = false,
}: TimeSlotsProps) => {
  const { mappedSlots } = useTimeSlots(slots);
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  const renderTimeSlot = (slot: Slot) => {
    const isSelected = !!selectedSlots.find(
      (item) => item.startTime === slot.startTime
    );
    const slotStyles = [
      themedStyles.timeSlotContainer,
      isSelected && themedStyles.selectedSlot,
      !slot.available && themedStyles.disabledSlot,
    ];

    return (
      <TouchableOpacity
        key={`slot-${slot.startTime}`}
        style={slotStyles}
        disabled={!slot.available}
        onPress={() => onTimeSlotPress(slot)}
      >
        <CustomText
          font="fields"
          weight="regular"
          text={slot.startTime}
          overrideStyle={[
            slot.available
              ? themedStyles.slotText
              : themedStyles.disabledSlotText,
            isSelected && themedStyles.selectedSlotText,
          ]}
        />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (mappedSlots.length === 0) {
    return (
      <View style={themedStyles.emptyStateContainer}>
        <Image source={Images.emptySlots} style={themedStyles.emptyIcon} />
        <CustomText
          text={t("booking.noSlots")}
          font="headline3"
          weight="semiBold"
          overrideStyle={themedStyles.emptyText}
        />
      </View>
    );
  }

  return (
    <View style={overrideStyle}>
      {mappedSlots.map((slot, index) => (
        <View key={`time-slot-${index}`} style={themedStyles.timeSection}>
          <View style={themedStyles.sectionIndicator}>
            <View style={themedStyles.indicatorDot} />
            <View
              style={[
                themedStyles.indicatorLine,
                index === slot.time.length - 1 && themedStyles.lastLine,
              ]}
            />
          </View>
          <View style={themedStyles.sectionContent}>
            <CustomText
              text={slot.label}
              font="headline2"
              weight="bold"
              overrideStyle={themedStyles.sectionTitle}
            />
            <View style={themedStyles.slotsContainer}>
              {slot.time.map(renderTimeSlot)}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default TimeSlots;
