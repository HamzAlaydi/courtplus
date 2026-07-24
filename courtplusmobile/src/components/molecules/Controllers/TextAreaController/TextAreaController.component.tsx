import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { TextArea } from "atoms/index";
import { TextAreaControllerProps } from "./TextAreaController.types";

const TextAreaController = ({
  name,
  overrideStyle,
  label,
}: TextAreaControllerProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextArea
          label={label}
          value={field.value}
          autoFocus={false}
          onChangeText={field.onChange}
          overrideStyle={overrideStyle}
          onBlur={field.onBlur}
          maxLength={120}
        />
      )}
    />
  );
};

export default TextAreaController;
