import React, { useRef } from "react";
import { Controller, useController, useFormContext } from "react-hook-form";
import { FloatingInput } from "atoms/index";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { GenderModal } from "molecules/index";
import { GenderControllerProps } from "./GenderController.types";
import { Keyboard } from "react-native";
import { mapGenderValue } from "utils";

const GenderController = ({
  name,
  overrideStyle,
  label,
  errorText,
  greyBackground = false,
  selectedGender,
}: GenderControllerProps) => {
  const { control } = useFormContext();
  const bottomsheetRef = useRef<BottomSheetModal>(null);
  const { field } = useController({
    control,
    name,
  });

  const handleOpenBottomSheet = () => {
    Keyboard.dismiss();
    bottomsheetRef.current?.present();
  };

  const handleSelectGender = (gender: string) => {
    field.onChange(mapGenderValue(gender)?.title);
    bottomsheetRef.current?.close();
    field.onBlur();
  };

  return (
    <>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <FloatingInput
            label={label}
            value={field.value}
            autoFocus={false}
            onChangeText={field.onChange}
            overrideStyle={overrideStyle}
            errorText={errorText}
            onFocus={handleOpenBottomSheet}
            greyBackground={greyBackground}
          />
        )}
      />
      <GenderModal
        isWhite={greyBackground}
        ref={bottomsheetRef}
        onSelectGender={handleSelectGender}
        selectedGender={selectedGender}
      />
    </>
  );
};

export default GenderController;
