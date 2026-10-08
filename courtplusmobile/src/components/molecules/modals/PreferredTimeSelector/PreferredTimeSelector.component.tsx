import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import React, { forwardRef, useMemo } from "react";
import { View } from "react-native";
import styles from "./PreferredTimeSelector.styles";
import { usePreferredTimeSelector } from "./PreferredTimeSelector.logic";
import { useTranslation } from "react-i18next";
import DayPeriodOption from "molecules/DayPeriodOption/DayPeriodOption.component";
import { PreferredTimeSelectorProps } from "./PreferredTimeSelector.types";

const PreferredTimeSelector = forwardRef<
  BottomSheetModal,
  PreferredTimeSelectorProps
>(({ onTimeSelect, selectedPreferredTime }, ref) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const {
    preferredTimeItems,
    handleSelectTime,
    isNextButtonDisabled,
    selectedTime,
  } = usePreferredTimeSelector(selectedPreferredTime ?? "");
  const { t } = useTranslation();
  return (
    <BottomSheetOverlay isWhite ref={ref} title={t("profile.preferredTime")}>
      <View>
        <CustomText
          text={t("profile.preferredTimeDesc")}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.description}
        />
        <View style={themedStyles.preferredTimeContainer}>
          {preferredTimeItems.map((item) => (
            <DayPeriodOption
              key={item.key}
              image={item.image}
              name={item.name}
              time={item.time}
              onPress={() => handleSelectTime(item.key)}
              isSelected={selectedTime === item.key}
              overrideStyle={themedStyles.option}
            />
          ))}
        </View>
        <CustomButton
          title={t("general.done")}
          onPress={() => onTimeSelect(selectedTime)}
          disabled={isNextButtonDisabled}
          variant={isNextButtonDisabled ? "disabledDark" : "primary"}
          overrideStyle={themedStyles.button}
        />
      </View>
    </BottomSheetOverlay>
  );
});

export default PreferredTimeSelector;
