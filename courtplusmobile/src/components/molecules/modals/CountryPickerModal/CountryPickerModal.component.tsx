import React from "react";
import { CountryPicker } from "react-native-country-codes-picker";
import { CountryPickerModalProps } from "./CountryPicker.types";
import { isRTL, verticalScale } from "utils";

const CountryPickerModal = ({
  show,
  onSelectCountry,
  onBackdropPress,
}: CountryPickerModalProps) => {
  return (
    <CountryPicker
      onBackdropPress={onBackdropPress}
      lang={isRTL ? "ar" : "en"}
      show={show}
      style={{
        modal: {
          maxHeight: verticalScale(600),
        },
      }}
      pickerButtonOnPress={onSelectCountry}
    />
  );
};

export default CountryPickerModal;
