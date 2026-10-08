import React, { useMemo } from "react";
import { ChipProps } from "./Chip.types";
import { useThemeContext } from "contexts";
import styles from "./Chip.styles";
import CustomText from "atoms/CustomText/CustomText.component";
import PressableScale from "atoms/PressableScale/PressableScale.component";

const Chip = ({
  title,
  onPress,
  overrideStyle,
  leftComponent,
  rightComponent,
  isSelected,
  overrideTextStyle,
  variant = "default",
  size = "medium",
  disabled = false,
}: ChipProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const isSmall = size === "small";
  const isDefault = variant === "default";

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { selected: isSelected, disabled } : {}}
      style={[
        themedStyles.container,
        isSmall && themedStyles.small,
        !!leftComponent &&
          (isSmall ? themedStyles.smallWithLeft : themedStyles.withLeft),
        !isDefault && themedStyles[variant],
        isSelected &&
          (isDefault ? themedStyles.selected : themedStyles.featureSelected),
        overrideStyle,
      ]}
    >
      {leftComponent && leftComponent}
      <CustomText
        text={title}
        font={isSmall ? "caption" : "headline3"}
        weight="semiBold"
        overrideStyle={[
          themedStyles.title,
          isSmall && themedStyles.smallTitle,
          !isDefault && themedStyles[`${variant}Title`],
          isDefault && isSelected && themedStyles.selectedTitle,
          overrideTextStyle,
        ]}
      />
      {rightComponent && rightComponent}
    </PressableScale>
  );
};

export default Chip;
