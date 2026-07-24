import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import styles from "./CustomButton.styles";
import { CustomButtonProps } from "./CustomButton.types";
import CustomText from "atoms/CustomText/CustomText.component";

const CustomButton = ({
  onPress,
  title,
  variant = "active",
  overrideStyle,
  disabled = false,
  overrideTextStyle,
  leftIcon,
}: CustomButtonProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[themedStyles.container, themedStyles[variant], overrideStyle]}
    >
      {leftIcon && leftIcon}
      <CustomText
        text={title}
        font="fields"
        weight="semiBold"
        overrideStyle={[themedStyles[`${variant}Text`], overrideTextStyle]}
      />
    </TouchableOpacity>
  );
};

export default CustomButton;
