import React, { useMemo } from "react";
import { Image } from "react-native";
import { Images } from "theme";
import i18n from "translation/index";
import { changeLanguage } from "utils";
import { LanguageIconProps } from "./LanguageIcon.types";
import { useThemeContext } from "contexts";
import styles from "./LanguageIcon.styles";
import PressableScale from "atoms/PressableScale/PressableScale.component";

const LanguageIcon = ({ overrideStyle }: LanguageIconProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const languageImage = i18n.language === "ar" ? Images.saudiLang : Images.us;

  return (
    <PressableScale
      style={[themedStyles.container, overrideStyle]}
      onPress={changeLanguage}
      accessibilityRole="button"
    >
      <Image source={languageImage} style={themedStyles.image} />
    </PressableScale>
  );
};

export default LanguageIcon;
