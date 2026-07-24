import React, { useState } from "react";
import { Controller, useController, useFormContext } from "react-hook-form";
import { FloatingInput } from "atoms/index";
import { DatePickerModal } from "molecules/index";
import { DateOfBirthControllerProps } from "./DateOfBirthController.types";
import { Keyboard } from "react-native";
import { formatDate } from "utils";

const DateOfBirthController = ({
  name,
  overrideStyle,
  label,
  errorText,
  greyBackground = false,
}: DateOfBirthControllerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { control } = useFormContext();
  const { field } = useController({
    control,
    name,
  });

  const handleOpenModal = () => {
    Keyboard.dismiss();
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    field.onBlur();
  };

  const handleConfirm = (date: Date) => {
    field.onChange(formatDate(date.toISOString(), "dd/MM/yyyy"));
    setIsOpen(false);
  };

  // Start the picker mid-range (not at the maximum date) so scrolling the
  // month/day wheels doesn't clamp and snap back to the boundary.
  const getInitialDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
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
            onFocus={handleOpenModal}
            greyBackground={greyBackground}
          />
        )}
      />
      {isOpen && (
        <DatePickerModal
          isOpen={isOpen}
          date={
            !field.value
              ? getInitialDate()
              : new Date(field.value.split("/").reverse().join("-"))
          }
          onConfirm={handleConfirm}
          onCancel={handleCloseModal}
        />
      )}
    </>
  );
};

export default DateOfBirthController;
