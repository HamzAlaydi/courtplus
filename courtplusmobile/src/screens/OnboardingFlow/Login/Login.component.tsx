import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { View, ImageBackground, Image } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import styles from "./Login.styles";
import { CustomButton, CustomText, LanguageIcon } from "atoms/index";
import { MobileController, OnboardingFooter } from "molecules/index";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { FormProvider } from "react-hook-form";
import { enterDrop, enterRise } from "utils";
import { useLogin } from "./Login.logic";

const LoginScreen = () => {
  const { top } = useSafeAreaInsets();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors, top), [colors, top]);
  const { t } = useTranslation();
  const { onLoginPress, onSignUpPress, methods } = useLogin();

  return (
    <ImageBackground source={Images.loginBg} style={themedStyles.container}>
      <Animated.View
        entering={enterDrop(0)}
        style={themedStyles.headerContainer}
      >
        <Image
          source={Images.horizontalLogo}
          style={themedStyles.logo}
          accessibilityIgnoresInvertColors
        />
        <LanguageIcon />
      </Animated.View>
      <KeyboardAwareScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        bounces={false}
        contentContainerStyle={themedStyles.keyboard}
      >
        <View style={themedStyles.bottomContainer}>
          <Animated.View entering={enterRise(1)}>
            <CustomText
              text={t("auth.signIn")}
              font="displayHero"
              weight="extraBold"
              accessibilityRole="header"
              overrideStyle={themedStyles.title}
            />
          </Animated.View>
          <FormProvider {...methods}>
            <Animated.View entering={enterRise(2)}>
              <MobileController
                name="phoneNumber"
                label={t("general.mobileNumber")}
                overrideStyle={themedStyles.input}
              />
            </Animated.View>

            <Animated.View entering={enterRise(3)}>
              <CustomButton
                title={t("auth.signIn")}
                variant="primary"
                onPress={methods.handleSubmit(onLoginPress)}
                overrideStyle={themedStyles.button}
              />
            </Animated.View>
          </FormProvider>

          <Animated.View entering={enterRise(4)}>
            <OnboardingFooter type="login" onPress={onSignUpPress} />
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
};

export default LoginScreen;
