import React, { useMemo } from "react";
import { CountryPicker } from "react-native-country-codes-picker";
import { CountryPickerModalProps } from "./CountryPicker.types";
import { isRTL } from "utils";
import { useThemeContext } from "contexts";
import styles from "./CountryPicker.styles";

const CountryPickerModal = ({
  show,
  onSelectCountry,
  onBackdropPress,
}: CountryPickerModalProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const pickerStyle = useMemo(() => styles(colors), [colors]);

  return (
    <CountryPicker
      onBackdropPress={onBackdropPress}
      lang={isRTL ? "ar" : "en"}
      show={show}
      style={pickerStyle}
      inputPlaceholderTextColor={colors.MUTED}
      pickerButtonOnPress={onSelectCountry}
    />
  );
};

export default CountryPickerModal;
