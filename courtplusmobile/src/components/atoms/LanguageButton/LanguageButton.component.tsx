import CustomText from "atoms/CustomText/CustomText.component";
import PressableScale from "atoms/PressableScale/PressableScale.component";
import React, { useMemo } from "react";
import { Image } from "react-native";
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
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
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
        weight="semiBold"
        overrideStyle={[
          themedStyles.title,
          isSelected && themedStyles.selectedTitle,
        ]}
      />
    </PressableScale>
  );
};

export default LanguageButton;
