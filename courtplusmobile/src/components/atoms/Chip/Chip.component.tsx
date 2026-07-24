import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { ChipProps } from "./Chip.types";
import { useThemeContext } from "contexts";
import styles from "./Chip.styles";
import CustomText from "atoms/CustomText/CustomText.component";

const Chip = ({
  title,
  onPress,
  overrideStyle,
  leftComponent,
  isSelected,
  overrideTextStyle,
}: ChipProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        themedStyles.container,
        isSelected && themedStyles.selected,
        overrideStyle,
      ]}
    >
      {leftComponent && leftComponent}
      <CustomText
        text={title}
        font="chip"
        weight="medium"
        overrideStyle={[themedStyles.title, overrideTextStyle]}
      />
    </TouchableOpacity>
  );
};

export default Chip;
