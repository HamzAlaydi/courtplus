import React, { useMemo } from "react";
import { StyleSheet, Text, TextStyle } from "react-native";
import { CustomTextProps, TypographyKeys, WeightOf } from "./CustomText.types";
import {
  getArabicScriptStyle,
  getFontType,
  hasArabicScript,
  Typography,
  UPPERCASE_VARIANTS,
} from "theme";
import { useThemeContext } from "contexts";
import { isArabic } from "utils";
import styles from "./CustomText.styles";

const fallbackStyle: TextStyle = { fontFamily: getFontType("regular") };

const getVariantStyle = <K extends TypographyKeys>(
  font: K,
  weight?: WeightOf<K>
): TextStyle => {
  const variant = Typography[font] as Record<string, TextStyle>;
  if (weight !== undefined && variant[weight as string]) {
    return variant[weight as string];
  }
  return fallbackStyle;
};

const CustomText = <K extends TypographyKeys>({
  text,
  overrideStyle,
  font,
  weight,
  uppercase,
  ...props
}: CustomTextProps<K>) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const colorStyle = useMemo(() => ({ color: colors.INK }), [colors]);
  const variantKey = (font ?? "body") as K;
  const variantStyle = getVariantStyle(variantKey, weight);
  const isArabicText = hasArabicScript(text);
  const shouldUppercase =
    !isArabic &&
    !isArabicText &&
    (uppercase ?? UPPERCASE_VARIANTS.includes(variantKey));
  const scriptStyle = isArabicText
    ? getArabicScriptStyle(StyleSheet.flatten([variantStyle, overrideStyle]))
    : undefined;

  return (
    <Text
      style={[
        styles.text,
        colorStyle,
        variantStyle,
        shouldUppercase && styles.uppercase,
        overrideStyle,
        scriptStyle,
      ]}
      {...props}
    >
      {text}
    </Text>
  );
};

export default CustomText;
