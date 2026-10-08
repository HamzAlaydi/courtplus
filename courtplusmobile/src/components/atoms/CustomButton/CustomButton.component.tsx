import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import styles from "./CustomButton.styles";
import { CustomButtonProps, CustomButtonVariant } from "./CustomButton.types";
import CustomText from "atoms/CustomText/CustomText.component";
import PressableScale from "atoms/PressableScale/PressableScale.component";

const DISPLAY_LABEL_VARIANTS: CustomButtonVariant[] = ["primary", "active"];

const CustomButton = ({
  onPress,
  title,
  variant = "active",
  size = "large",
  overrideStyle,
  disabled = false,
  overrideTextStyle,
  leftIcon,
  rightIcon,
}: CustomButtonProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const usesDisplayLabel = DISPLAY_LABEL_VARIANTS.includes(variant);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        themedStyles.container,
        themedStyles[size],
        themedStyles[variant],
        overrideStyle,
      ]}
    >
      {leftIcon && leftIcon}
      {usesDisplayLabel ? (
        <CustomText
          text={title}
          font="displayButton"
          weight="bold"
          overrideStyle={[
            themedStyles.displayLabel,
            themedStyles[`${variant}Text`],
            overrideTextStyle,
          ]}
        />
      ) : (
        <CustomText
          text={title}
          font="headline3"
          weight="semiBold"
          overrideStyle={[
            themedStyles.label,
            themedStyles[`${variant}Text`],
            overrideTextStyle,
          ]}
        />
      )}
      {rightIcon && rightIcon}
    </PressableScale>
  );
};

export default CustomButton;
