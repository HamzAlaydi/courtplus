import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { MobileControllerProps } from "./MobileController.types";
import { CustomText, FloatingInput } from "atoms/index";
import { Image, TouchableOpacity, View } from "react-native";
import { Images } from "theme";
import { CountryPickerModal } from "molecules/index";
import { CountryItem } from "react-native-country-codes-picker";
import Flag from "react-native-round-flags";
import styles from "./MobileController.styles";
import { useThemeContext } from "contexts";
import { CountryCode, getCountryCallingCode } from "libphonenumber-js";
import { includeCountryCode, toEnglishDigits } from "utils";
import { useAppStore } from "store";
import { useLocation } from "hooks";

const MobileController = ({
  label,
  name,
  overrideStyle,
  errorText,
  greyBackground = false,
  phoneNumber,
}: MobileControllerProps) => {
  const { getDeviceCountryCode } = useLocation();
  const { control } = useFormContext();
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const phoneNumberWithCountryCode = includeCountryCode(phoneNumber ?? "");

  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(
    phoneNumber ? phoneNumberWithCountryCode : null
  );
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const setSelectedCountryCode = useAppStore(
    (state) => state.setSelectedCountryCode
  );

  const handleOpenCountryPicker = () => {
    setShowCountryPicker(true);
  };

  const handleSelectCountry = (item: CountryItem) => {
    setSelectedCountry(item);
    setSelectedCountryCode(item.dial_code);
    setShowCountryPicker(false);
  };

  const handleCloseCountryPicker = () => {
    setShowCountryPicker(false);
  };

  const leftComponent = (
    <TouchableOpacity
      onPress={handleOpenCountryPicker}
      style={themedStyles.countryItemContainer}
    >
      <Flag
        code={selectedCountry?.code || "EG"}
        style={themedStyles.countryItemFlag}
      />
      <Image source={Images.arrowDown} />
      <View style={themedStyles.countryItemSeparator} />
      <CustomText
        font="fields"
        weight="semiBold"
        text={selectedCountry?.dial_code || "+20"}
        overrideStyle={themedStyles.countryCode}
      />
    </TouchableOpacity>
  );

  const handleGetDeviceCountryCode = async () => {
    const countryCode = await getDeviceCountryCode();
    const callingCode = getCountryCallingCode(countryCode as CountryCode);
    // global use this code to get the country code for the selected country
    setSelectedCountryCode(`+${callingCode}`);
    setSelectedCountry({
      code: countryCode ?? "EG",
      dial_code: `+${callingCode}`,
      name: { en: countryCode ?? "EG", ar: countryCode ?? "مصر" },
      flag: "",
    });
  };

  useEffect(() => {
    if (!phoneNumber) {
      handleGetDeviceCountryCode();
    } else {
      setSelectedCountryCode(phoneNumberWithCountryCode?.dial_code);
    }
  }, [phoneNumber]);

  return (
    <>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <FloatingInput
            greyBackground={greyBackground}
            label={label}
            value={field.value}
            autoFocus={false}
            onChangeText={(text) => field.onChange(toEnglishDigits(text))}
            overrideStyle={overrideStyle}
            leftComponent={leftComponent}
            errorText={errorText}
            onBlur={field.onBlur}
            keyboardType="number-pad"
            showContent
          />
        )}
      />
      {showCountryPicker && (
        <CountryPickerModal
          onBackdropPress={handleCloseCountryPicker}
          show={showCountryPicker}
          onSelectCountry={handleSelectCountry}
        />
      )}
    </>
  );
};

export default MobileController;
