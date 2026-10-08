import {
  BackButton,
  Chip,
  CustomButton,
  CustomSwitch,
  CustomText,
  PressableScale,
} from "atoms/index";
import { useThemeContext } from "contexts";
import { HorizontalDatePicker } from "molecules/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageSourcePropType,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import { enterRise, exitFade, verticalScale } from "utils";
import { useCourtFilter } from "./CourtFilter.logic";
import styles from "./CourtFilter.styles";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

type ToggleRow = {
  key: string;
  icon: ImageSourcePropType;
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const CourtFilterScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { top, bottom } = useSafeAreaInsets();
  const {
    sportOptions,
    selectedSports,
    onSportPress,
    minRating,
    setMinRating,
    availabilityEnabled,
    setAvailabilityEnabled,
    airConditionedOnly,
    setAirConditionedOnly,
    womenOnlyEnabled,
    setWomenOnlyEnabled,
    selectedDate,
    setSelectedDate,
    periodItems,
    selectedPeriod,
    setSelectedPeriod,
    durationOptions,
    duration,
    setDuration,
    onApply,
    onClear,
  } = useCourtFilter();

  const toggleRows: ToggleRow[] = [
    {
      key: "airConditioned",
      icon: Images.airConditioner,
      label: t("filters.airConditioned"),
      hint: t("filters.airConditionedHint", { defaultValue: "" }),
      value: airConditionedOnly,
      onValueChange: setAirConditionedOnly,
    },
    {
      key: "womenOnly",
      icon: Images.womenOnly,
      label: t("filters.womenOnly"),
      hint: t("filters.womenOnlyHint", { defaultValue: "" }),
      value: womenOnlyEnabled,
      onValueChange: setWomenOnlyEnabled,
    },
    {
      key: "availability",
      icon: Images.calendar,
      label: t("filters.availability"),
      hint: t("filters.availabilityHint", { defaultValue: "" }),
      value: availabilityEnabled,
      onValueChange: setAvailabilityEnabled,
    },
  ];

  const activeCount =
    selectedSports.length +
    [
      minRating > 0,
      airConditionedOnly,
      womenOnlyEnabled,
      availabilityEnabled,
    ].filter(Boolean).length;

  const ctaTitle =
    activeCount > 0
      ? `${t("filters.showResults")} (${activeCount})`
      : t("filters.showResults");

  return (
    <View style={themedStyles.screen}>
      <StatusBar barStyle="light-content" />
      <View
        style={[themedStyles.topBar, { paddingTop: top + verticalScale(8) }]}
      >
        <BackButton />
      </View>

      <View style={themedStyles.sheet}>
        <View style={themedStyles.handle} />
        <View style={themedStyles.sheetHeader}>
          <CustomText
            text={t("filters.title")}
            font="screenTitle"
            weight="extraBold"
            numberOfLines={1}
            accessibilityRole="header"
            overrideStyle={themedStyles.sheetTitle}
          />
          <PressableScale
            onPress={onClear}
            hitSlop={8}
            style={themedStyles.clearButton}
            accessibilityRole="button"
          >
            <CustomText
              text={t("general.clear")}
              font="headline3"
              weight="semiBold"
              overrideStyle={themedStyles.clearText}
            />
          </PressableScale>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={themedStyles.content}
        >
          <Animated.View entering={enterRise(0)} style={themedStyles.section}>
            <CustomText
              text={t("filters.sport")}
              font="sectionTitle"
              weight="bold"
            />
            <View style={themedStyles.chipsWrap}>
              {sportOptions.map((sport) => {
                const isSportSelected = selectedSports.includes(sport.value);
                return (
                  <Chip
                    key={sport.value}
                    title={sport.label}
                    isSelected={isSportSelected}
                    onPress={() => onSportPress(sport.value)}
                    overrideStyle={themedStyles.sportChip}
                    overrideTextStyle={themedStyles.chipText}
                    leftComponent={
                      <View
                        style={[
                          themedStyles.sportIconContainer,
                          isSportSelected &&
                            themedStyles.selectedSportIconContainer,
                        ]}
                      >
                        <Image
                          source={Images[sport.icon]}
                          style={themedStyles.sportIcon}
                        />
                      </View>
                    }
                  />
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={enterRise(1)} style={themedStyles.section}>
            <CustomText
              text={t("filters.rating")}
              font="sectionTitle"
              weight="bold"
            />
            <View style={themedStyles.ratingRow}>
              {RATING_OPTIONS.map((option) => {
                const isRatingSelected = minRating === option;
                return (
                  <Chip
                    key={option}
                    title={option < 5 ? `${option}+` : `${option}`}
                    isSelected={isRatingSelected}
                    onPress={() => setMinRating(isRatingSelected ? 0 : option)}
                    overrideStyle={[
                      themedStyles.ratingChip,
                      isRatingSelected && themedStyles.selectedRatingChip,
                    ]}
                    overrideTextStyle={[
                      themedStyles.chipText,
                      themedStyles.ratingText,
                    ]}
                    leftComponent={
                      <Image
                        source={Images.star}
                        style={themedStyles.ratingStar}
                      />
                    }
                  />
                );
              })}
            </View>
          </Animated.View>

          <Animated.View
            entering={enterRise(2)}
            style={themedStyles.toggleGroup}
          >
            {toggleRows.map((row, index) => (
              <View
                key={row.key}
                style={[
                  themedStyles.toggleRow,
                  index < toggleRows.length - 1 && themedStyles.toggleDivider,
                ]}
              >
                <View style={themedStyles.toggleIconTile}>
                  <Image source={row.icon} style={themedStyles.toggleIcon} />
                </View>
                <View style={themedStyles.toggleTextContainer}>
                  <CustomText
                    text={row.label}
                    font="headline3"
                    weight="semiBold"
                    overrideStyle={themedStyles.toggleLabel}
                  />
                  {!!row.hint && (
                    <CustomText
                      text={row.hint}
                      font="caption"
                      weight="regular"
                      overrideStyle={themedStyles.toggleHint}
                    />
                  )}
                </View>
                <CustomSwitch
                  value={row.value}
                  onValueChange={row.onValueChange}
                />
              </View>
            ))}
          </Animated.View>

          {availabilityEnabled && (
            <Animated.View
              entering={enterRise(0)}
              exiting={exitFade()}
              style={themedStyles.availability}
            >
              <HorizontalDatePicker
                selectedDate={selectedDate}
                onDayPress={setSelectedDate}
              />
              <View style={themedStyles.section}>
                <CustomText
                  text={t("general.time")}
                  font="sectionTitle"
                  weight="small"
                />
                <View style={themedStyles.periodGrid}>
                  {periodItems.map((item) => {
                    const isPeriodSelected = selectedPeriod === item.key;
                    return (
                      <PressableScale
                        key={item.key}
                        onPress={() => setSelectedPeriod(item.key)}
                        style={[
                          themedStyles.periodTile,
                          isPeriodSelected && themedStyles.selectedPeriodTile,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isPeriodSelected }}
                      >
                        <View
                          style={[
                            themedStyles.periodIconContainer,
                            isPeriodSelected &&
                              themedStyles.selectedPeriodIconContainer,
                          ]}
                        >
                          <Image
                            source={item.image}
                            style={themedStyles.periodIcon}
                          />
                        </View>
                        <View style={themedStyles.periodTextContainer}>
                          <CustomText
                            text={item.name}
                            font="headline3"
                            weight="semiBold"
                            numberOfLines={1}
                            overrideStyle={[
                              themedStyles.periodName,
                              isPeriodSelected &&
                                themedStyles.selectedPeriodName,
                            ]}
                          />
                          <CustomText
                            text={item.time}
                            font="caption"
                            weight="regular"
                            numberOfLines={1}
                            overrideStyle={[
                              themedStyles.periodTime,
                              isPeriodSelected &&
                                themedStyles.selectedPeriodTime,
                            ]}
                          />
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
              <View style={themedStyles.section}>
                <CustomText
                  text={t("filters.duration")}
                  font="sectionTitle"
                  weight="small"
                />
                <View style={themedStyles.durationGrid}>
                  {durationOptions.map((option) => {
                    const isDurationSelected = duration === option;
                    return (
                      <PressableScale
                        key={option}
                        onPress={() => setDuration(option)}
                        style={[
                          themedStyles.durationOption,
                          isDurationSelected &&
                            themedStyles.selectedDurationOption,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isDurationSelected }}
                      >
                        <CustomText
                          text={`${option} ${t("general.mins")}`}
                          font="headline3"
                          weight="semiBold"
                          numberOfLines={1}
                          overrideStyle={[
                            themedStyles.durationText,
                            isDurationSelected &&
                              themedStyles.selectedDurationText,
                          ]}
                        />
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <View
          style={[
            themedStyles.footer,
            { paddingBottom: bottom + verticalScale(14) },
          ]}
        >
          <CustomButton title={ctaTitle} onPress={onApply} variant="primary" />
        </View>
      </View>
    </View>
  );
};

export default CourtFilterScreen;
