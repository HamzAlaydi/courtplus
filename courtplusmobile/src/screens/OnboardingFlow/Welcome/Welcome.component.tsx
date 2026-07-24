import { useThemeContext } from "contexts";
import { MainWrapper } from "organisms/index";
import React, { useMemo, useState } from "react";
import { View, Image } from "react-native";
import styles from "./Welcome.styles";
import { Images } from "theme";
import { CustomButton, CustomText, LanguageButton } from "atoms/index";
import { useTranslation } from "react-i18next";
import { StackActions, useNavigation } from "@react-navigation/native";
import { OnboardingStackNavigationProp } from "navigation/types";
import i18n from "translation/index";
import { changeLanguage, isRTL } from "utils";
import { useAppStore } from "store";

const WelcomeScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    isRTL ? "ar" : "en"
  );
  const setFirstVisit = useAppStore((state) => state.setFirstVisit);

  const navigation = useNavigation<OnboardingStackNavigationProp>();

  const shouldChangeLanguage = () => {
    if (i18n.language === currentLanguage) return false;
    changeLanguage();
    return true;
  };

  const handleDonePress = () => {
    if (!shouldChangeLanguage()) {
      setFirstVisit();
      navigation.dispatch(StackActions.replace("Login"));
    }
  };

  return (
    <MainWrapper
      overrideContentStyle={themedStyles.content}
      overrideContainerStyle={themedStyles.container}
    >
      <Image source={Images.logoGroup} style={themedStyles.logo} />
      <View style={themedStyles.languageContainer}>
        <CustomText
          text={t("language.title")}
          font="fields"
          weight="semiBold"
          overrideStyle={themedStyles.title}
        />

        <LanguageButton
          image={Images.saudi}
          title={t("language.arabic")}
          isSelected={currentLanguage === "ar"}
          onPress={() => setCurrentLanguage("ar")}
          overrideStyle={themedStyles.arabicButton}
        />
        <LanguageButton
          image={Images.us}
          title={t("language.english")}
          isSelected={currentLanguage === "en"}
          onPress={() => setCurrentLanguage("en")}
        />

        <CustomButton
          title={t("general.done")}
          onPress={handleDonePress}
          overrideStyle={themedStyles.button}
        />
      </View>
    </MainWrapper>
  );
};

export default WelcomeScreen;
