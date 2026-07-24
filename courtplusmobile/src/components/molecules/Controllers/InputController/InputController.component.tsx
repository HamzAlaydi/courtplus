import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { InputControllerProps } from "./InputController.types";
import { FloatingInput } from "atoms/index";

const InputController = ({
  name,
  overrideStyle,
  label,
  leftComponent,
  errorText,
  greyBackground,
}: InputControllerProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FloatingInput
          greyBackground={greyBackground}
          label={label}
          value={field.value}
          autoFocus={false}
          onChangeText={field.onChange}
          overrideStyle={overrideStyle}
          leftComponent={leftComponent}
          errorText={errorText}
          onBlur={field.onBlur}
        />
      )}
    />
  );
};

export default InputController;
