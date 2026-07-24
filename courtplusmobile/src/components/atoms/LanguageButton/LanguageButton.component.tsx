import CustomText from "atoms/CustomText/CustomText.component";
import React, { useMemo } from "react";
import { Image, TouchableOpacity } from "react-native";
import { LanguageButtonProps } from "./LanguageButton.types";
import { useThemeContext } from "contexts";
import styles from "./LanguageButton.styles";

const LanguageButton = ({
  onPress,
  title,
  isSelected,
  image,
  overrideStyle,
}: LanguageButtonProps) => {
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
      <Image source={image} style={themedStyles.image} />
      <CustomText
        text={title}
        font="fields"
        weight="bold"
        overrideStyle={[
          themedStyles.title,
          isSelected && themedStyles.selectedTitle,
        ]}
      />
    </TouchableOpacity>
  );
};

export default LanguageButton;
