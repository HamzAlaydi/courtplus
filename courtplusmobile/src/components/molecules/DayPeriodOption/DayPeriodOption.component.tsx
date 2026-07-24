import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, TouchableOpacity } from "react-native";
import styles from "./DayPeriodOption.styles";
import { CustomText } from "atoms/index";
import { DayPeriodOptionProps } from "./DayPeriodOption.types";

const DayPeriodOption = ({
  image,
  name,
  time,
  onPress,
  isSelected,
  overrideStyle,
}: DayPeriodOptionProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        themedStyles.container,
        isSelected && themedStyles.selectedContainer,
        overrideStyle,
      ]}
    >
      <Image source={image} style={themedStyles.image} />
      <CustomText
        text={name}
        font="headline2"
        weight="semiBold"
        overrideStyle={themedStyles.title}
      />
      <CustomText
        text={time}
        font="text"
        weight="medium"
        overrideStyle={[
          themedStyles.itemDescription,
          isSelected && themedStyles.selectedItemDescription,
        ]}
      />
    </TouchableOpacity>
  );
};

export default DayPeriodOption;
