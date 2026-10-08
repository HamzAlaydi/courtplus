import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import styles from "./DayPeriodOption.styles";
import { CustomText, PressableScale } from "atoms/index";
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
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      style={[
        themedStyles.container,
        isSelected && themedStyles.selectedContainer,
        overrideStyle,
      ]}
    >
      <View
        style={[
          themedStyles.iconContainer,
          isSelected && themedStyles.selectedIconContainer,
        ]}
      >
        <Image
          source={image}
          style={[themedStyles.image, isSelected && themedStyles.selectedImage]}
        />
      </View>
      <CustomText
        text={name}
        font="cardTitle"
        weight="semiBold"
        numberOfLines={1}
        overrideStyle={[
          themedStyles.title,
          isSelected && themedStyles.selectedTitle,
        ]}
      />
      <CustomText
        text={time}
        font="caption"
        weight="medium"
        numberOfLines={1}
        overrideStyle={[
          themedStyles.itemDescription,
          isSelected && themedStyles.selectedItemDescription,
        ]}
      />
    </PressableScale>
  );
};

export default DayPeriodOption;
