import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { View, ImageBackground, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import styles from "./Login.styles";
import { CustomButton, CustomText, LanguageIcon } from "atoms/index";
import { MobileController, OnboardingFooter } from "molecules/index";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { FormProvider } from "react-hook-form";
import { useLogin } from "./Login.logic";

const LoginScreen = () => {
  const { top } = useSafeAreaInsets();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors, top), [colors]);
  const { t } = useTranslation();
  const { onLoginPress, onSignUpPress, methods } = useLogin();

  return (
    <ImageBackground source={Images.loginBg} style={themedStyles.container}>
      <View style={themedStyles.headerContainer}>
        <Image source={Images.horizontalLogo} style={themedStyles.logo} />
        <LanguageIcon />
      </View>
      <KeyboardAwareScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        bounces={false}
        contentContainerStyle={themedStyles.keyboard}
      >
        <View style={themedStyles.bottomContainer}>
          <CustomText
            text={t("auth.signIn")}
            font="headline1"
            weight="semiBold"
            overrideStyle={{ color: colors.WHITE }}
          />
          <FormProvider {...methods}>
            <MobileController
              name="phoneNumber"
              label={t("general.mobileNumber")}
              overrideStyle={themedStyles.input}
            />

            <CustomButton
              title={t("auth.signIn")}
              onPress={methods.handleSubmit(onLoginPress)}
              overrideStyle={themedStyles.button}
            />
          </FormProvider>

          <OnboardingFooter type="login" onPress={onSignUpPress} />
        </View>
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
};

export default LoginScreen;
