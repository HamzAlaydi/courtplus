import React, { useMemo } from "react";
import { Image, TouchableOpacity } from "react-native";
import { Images } from "theme";
import i18n from "translation/index";
import { changeLanguage } from "utils";
import { LanguageIconProps } from "./LanguageIcon.types";
import { useThemeContext } from "contexts";
import styles from "./LanguageIcon.styles";

const LanguageIcon = ({ overrideStyle }: LanguageIconProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const languageImage = i18n.language === "ar" ? Images.saudiLang : Images.us;

  return (
    <TouchableOpacity
      style={[themedStyles.container, overrideStyle]}
      onPress={changeLanguage}
    >
      <Image source={languageImage} style={themedStyles.image} />
    </TouchableOpacity>
  );
};

export default LanguageIcon;
