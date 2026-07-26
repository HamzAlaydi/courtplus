import { Chip, CustomButton, CustomSwitch, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import DayPeriodOption from "molecules/DayPeriodOption/DayPeriodOption.component";
import { Header, HorizontalDatePicker, StarDisplay } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { Images } from "theme";
import { useCourtFilter } from "./CourtFilter.logic";
import styles from "./CourtFilter.styles";

const CourtFilterScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const {
    sportOptions,
    selectedSports,
    onSportPress,
    minRating,
    setMinRating,
    availabilityEnabled,
    setAvailabilityEnabled,
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

  return (
    <MainWrapper
      scrollEnabled
      whiteBackground
      overrideContentStyle={themedStyles.container}
    >
      <Header
        title={t("filters.title")}
        overrideStyle={themedStyles.header}
        trailingComponent={
          <CustomText
            text={t("general.clear")}
            font="headline3"
            weight="medium"
            onPress={onClear}
            overrideStyle={themedStyles.clearText}
          />
        }
      />
      <CustomText
        text={t("filters.sport")}
        font="headline3"
        weight="semiBold"
        overrideStyle={themedStyles.sectionTitle}
      />
      <View style={themedStyles.chipsContainer}>
        {sportOptions.map((sport) => {
          const isSportSelected = selectedSports.includes(sport.value);
          return (
            <Chip
              key={sport.value}
              title={sport.label}
              isSelected={isSportSelected}
              onPress={() => onSportPress(sport.value)}
              leftComponent={
                <View
                  style={[
                    themedStyles.iconContainer,
                    isSportSelected && themedStyles.selectedIconContainer,
                  ]}
                >
                  <Image
                    source={Images[sport.icon]}
                    style={[
                      themedStyles.icon,
                      isSportSelected && themedStyles.selectedIcon,
                    ]}
                  />
                </View>
              }
            />
          );
        })}
      </View>
      <CustomText
        text={t("filters.rating")}
        font="headline3"
        weight="semiBold"
        overrideStyle={themedStyles.sectionTitle}
      />
      <View style={themedStyles.ratingContainer}>
        <StarDisplay rating={minRating} onChange={setMinRating} />
        {minRating > 0 && (
          <CustomText
            text={`${minRating} ${t("filters.upAbove")}`}
            font="chip"
            weight="medium"
            overrideStyle={themedStyles.ratingHint}
          />
        )}
      </View>
      <View style={themedStyles.availabilityHeader}>
        <CustomText
          text={t("filters.availability")}
          font="headline3"
          weight="semiBold"
        />
        <CustomSwitch
          value={availabilityEnabled}
          onValueChange={setAvailabilityEnabled}
        />
      </View>
      {availabilityEnabled && (
        <View>
          <HorizontalDatePicker
            selectedDate={selectedDate}
            onDayPress={setSelectedDate}
            overrideContainerStyle={themedStyles.datePicker}
          />
          <CustomText
            text={t("general.time")}
            font="chip"
            weight="regular"
            overrideStyle={themedStyles.subSectionTitle}
          />
          <View style={themedStyles.periodsContainer}>
            {periodItems.map((item) => (
              <DayPeriodOption
                key={item.key}
                image={item.image}
                name={item.name}
                time={item.time}
                isSelected={selectedPeriod === item.key}
                onPress={() => setSelectedPeriod(item.key)}
              />
            ))}
          </View>
          <CustomText
            text={t("filters.duration")}
            font="chip"
            weight="regular"
            overrideStyle={themedStyles.subSectionTitle}
          />
          <View style={themedStyles.chipsContainer}>
            {durationOptions.map((option) => (
              <Chip
                key={option}
                title={`${option} ${t("general.mins")}`}
                isSelected={duration === option}
                onPress={() => setDuration(option)}
                overrideStyle={themedStyles.durationChip}
              />
            ))}
          </View>
        </View>
      )}
      <CustomButton
        title={t("filters.showResults")}
        onPress={onApply}
        overrideStyle={themedStyles.applyButton}
      />
    </MainWrapper>
  );
};

export default CourtFilterScreen;
