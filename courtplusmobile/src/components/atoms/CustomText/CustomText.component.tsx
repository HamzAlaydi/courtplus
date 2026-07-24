import React from "react";
import { Text } from "react-native";
import { CustomTextProps, TypographyKeys, WeightOf } from "./CustomText.types";
import { Typography } from "theme";
import styles from "./CustomText.styles";

const CustomText = <K extends TypographyKeys>({
  text,
  overrideStyle,
  font,
  weight,
  ...props
}: CustomTextProps<K>) => {
  return (
    <Text
      style={[
        styles.text,
        {
          ...Typography[font ?? "body"][weight as keyof WeightOf<K>],
        },
        overrideStyle,
      ]}
      {...props}
    >
      {text}
    </Text>
  );
};

export default CustomText;
