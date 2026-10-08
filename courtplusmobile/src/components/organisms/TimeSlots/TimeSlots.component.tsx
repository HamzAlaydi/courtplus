import React, { useEffect, useMemo } from "react";
import { Image, ImageSourcePropType, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { TimeSlotsProps } from "./TimeSlots.type";
import { useTimeSlots } from "./TimeSlots.logic";
import { Slot } from "models";
import { CustomText, PressableScale } from "atoms/index";
import { EmptyState } from "molecules/index";
import { useThemeContext } from "contexts";
import styles from "./TimeSlots.styles";
import { ColorsType, Images, Radius } from "theme";
import { useTranslation } from "react-i18next";
import {
  enterRise,
  horizontalScale,
  spacing,
  STATE_TIMING,
  verticalScale,
} from "utils";

const SLOTS_PER_ROW = 4;
const SKELETON_ROWS = 3;

const chunkSlots = (slots: Slot[]) => {
  const rows: Slot[][] = [];
  for (let index = 0; index < slots.length; index += SLOTS_PER_ROW) {
    rows.push(slots.slice(index, index + SLOTS_PER_ROW));
  }
  return rows;
};

type TimeSlotButtonProps = {
  slot: Slot;
  isSelected: boolean;
  onPress: (slot: Slot) => void;
  colors: ColorsType;
  themedStyles: ReturnType<typeof styles>;
};

const TimeSlotButton = ({
  slot,
  isSelected,
  onPress,
  colors,
  themedStyles,
}: TimeSlotButtonProps) => {
  const progress = useSharedValue(isSelected ? 1 : 0);
  const idleBackground = colors.CARD;
  const idleBorder = colors.LINE;
  const activeColor = colors.LIME;

  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, STATE_TIMING);
  }, [isSelected, progress]);

  const animatedFill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [idleBackground, activeColor]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [idleBorder, activeColor]
    ),
  }));

  return (
    <PressableScale
      style={themedStyles.timeSlotContainer}
      disabled={!slot.available}
      disableScale={!slot.available}
      onPress={() => onPress(slot)}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: !slot.available }}
    >
      {slot.available ? (
        <Animated.View style={[themedStyles.slotFill, animatedFill]} />
      ) : (
        <View style={[themedStyles.slotFill, themedStyles.disabledSlot]} />
      )}
      <CustomText
        font="headline3"
        weight="semiBold"
        text={slot.startTime}
        numberOfLines={1}
        overrideStyle={[
          themedStyles.slotText,
          !slot.available && themedStyles.disabledSlotText,
        ]}
      />
    </PressableScale>
  );
};

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

  const periodIcons: Record<string, ImageSourcePropType> = useMemo(
    () => ({
      [t("booking.morning")]: Images.sunrise,
      [t("booking.day")]: Images.sun,
      [t("booking.evening")]: Images.night,
    }),
    [t]
  );

  if (isLoading) {
    return (
      <View style={overrideStyle}>
        <SkeletonPlaceholder
          speed={1100}
          borderRadius={Radius.medium}
          backgroundColor={colors.LINE}
          highlightColor={colors.SUBTLE}
        >
          <SkeletonPlaceholder.Item gap={spacing[8]}>
            <SkeletonPlaceholder.Item
              width={horizontalScale(110)}
              height={horizontalScale(16)}
              borderRadius={Radius.small}
              marginBottom={verticalScale(2)}
            />
            {Array.from({ length: SKELETON_ROWS }, (_, row) => (
              <SkeletonPlaceholder.Item
                key={`slot-skeleton-row-${row}`}
                flexDirection="row"
                gap={spacing[8]}
              >
                {Array.from({ length: SLOTS_PER_ROW }, (__, cell) => (
                  <SkeletonPlaceholder.Item
                    key={`slot-skeleton-${row}-${cell}`}
                    flex={1}
                    height={verticalScale(44)}
                  />
                ))}
              </SkeletonPlaceholder.Item>
            ))}
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder>
      </View>
    );
  }

  if (mappedSlots.length === 0) {
    return (
      <EmptyState
        image={Images.emptySlots}
        title={t("booking.noSlots")}
        overrideStyle={themedStyles.emptyState}
        overrideImageStyle={themedStyles.emptyIcon}
      />
    );
  }

  return (
    <View style={[themedStyles.container, overrideStyle]}>
      {mappedSlots.map((slot, index) => {
        const icon = periodIcons[slot.label];
        return (
          <Animated.View
            key={`time-slot-${index}`}
            entering={enterRise(index)}
            style={themedStyles.timeSection}
          >
            <View style={themedStyles.sectionHeader}>
              {!!icon && (
                <View style={themedStyles.sectionIconContainer}>
                  <Image source={icon} style={themedStyles.sectionIcon} />
                </View>
              )}
              <CustomText
                text={slot.label}
                font="sectionTitle"
                weight="small"
                accessibilityRole="header"
                overrideStyle={themedStyles.sectionTitle}
              />
            </View>
            <View style={themedStyles.slotsContainer}>
              {chunkSlots(slot.time).map((row, rowIndex) => (
                <View
                  key={`time-slot-row-${index}-${rowIndex}`}
                  style={themedStyles.slotsRow}
                >
                  {row.map((item) => (
                    <TimeSlotButton
                      key={`slot-${item.startTime}`}
                      slot={item}
                      isSelected={
                        !!selectedSlots.find(
                          (selected) => selected.startTime === item.startTime
                        )
                      }
                      onPress={onTimeSlotPress}
                      colors={colors}
                      themedStyles={themedStyles}
                    />
                  ))}
                  {Array.from(
                    { length: SLOTS_PER_ROW - row.length },
                    (_, fillerIndex) => (
                      <View
                        key={`time-slot-filler-${rowIndex}-${fillerIndex}`}
                        style={themedStyles.slotPlaceholder}
                      />
                    )
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default TimeSlots;
