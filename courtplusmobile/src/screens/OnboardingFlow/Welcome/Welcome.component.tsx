import { useThemeContext } from "contexts";
import { MainWrapper } from "organisms/index";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import styles from "./Welcome.styles";
import { Images } from "theme";
import { CustomButton, CustomText, LanguageButton } from "atoms/index";
import { useTranslation } from "react-i18next";
import { StackActions, useNavigation } from "@react-navigation/native";
import { OnboardingStackNavigationProp } from "navigation/types";
import i18n from "translation/index";
import { changeLanguage, enterDrop, enterRise, isRTL } from "utils";
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
    <MainWrapper enableSafeArea overrideContainerStyle={themedStyles.container}>
      <View style={themedStyles.logoContainer}>
        <Animated.Image
          entering={enterDrop(0)}
          source={Images.logoGroup}
          style={themedStyles.logo}
          accessibilityIgnoresInvertColors
        />
      </View>
      <View style={themedStyles.languageContainer}>
        <Animated.View entering={enterRise(1)}>
          <CustomText
            text={t("language.title")}
            font="screenTitle"
            weight="extraBold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
        </Animated.View>

        <Animated.View entering={enterRise(2)}>
          <LanguageButton
            image={Images.saudi}
            title={t("language.arabic")}
            isSelected={currentLanguage === "ar"}
            onPress={() => setCurrentLanguage("ar")}
          />
        </Animated.View>
        <Animated.View entering={enterRise(3)}>
          <LanguageButton
            image={Images.us}
            title={t("language.english")}
            isSelected={currentLanguage === "en"}
            onPress={() => setCurrentLanguage("en")}
          />
        </Animated.View>
      </View>

      <Animated.View entering={enterRise(4)}>
        <CustomButton
          title={t("general.done")}
          variant="primary"
          onPress={handleDonePress}
          overrideStyle={themedStyles.button}
        />
      </Animated.View>
    </MainWrapper>
  );
};

export default WelcomeScreen;
