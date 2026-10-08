import { useThemeContext } from "contexts";
import { Header, OTPView } from "molecules/index";
import React, { useMemo } from "react";
import { Image, ImageBackground, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import styles from "./OTPVerification.styles";
import { CustomText } from "atoms/index";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { enterRise } from "utils";
import { useOTPVerification } from "./OTPVerification.logic";

const OTPVerificationScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const {
    onFilled,
    phoneNumber,
    onSendCode,
    footerText,
    footerText2,
    onFooterPress,
  } = useOTPVerification();

  return (
    <ImageBackground
      source={Images.otpVerificationBg}
      style={themedStyles.container}
    >
      <Header
        leadingComponent={
          <Image
            source={Images.horizontalLogo}
            style={themedStyles.logo}
            accessibilityIgnoresInvertColors
          />
        }
      />
      <KeyboardAwareScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        bounces={false}
        contentContainerStyle={themedStyles.keyboard}
      >
        <View style={themedStyles.bottomContainer}>
          <Animated.View entering={enterRise(0)}>
            <CustomText
              text={t("auth.verificationOtpLogin")}
              font="displayHero"
              weight="extraBold"
              accessibilityRole="header"
              overrideStyle={themedStyles.title}
            />
            <Text style={themedStyles.codeContainer}>
              <CustomText
                text={t("auth.sendCode")}
                font="headline3"
                weight="regular"
                overrideStyle={themedStyles.codeText}
              />
              <CustomText
                text={phoneNumber}
                font="headline3"
                weight="semiBold"
                overrideStyle={themedStyles.codeText1}
              />
              <CustomText
                text={t("auth.checkMessages")}
                font="headline3"
                weight="regular"
                overrideStyle={themedStyles.codeText}
              />
            </Text>
          </Animated.View>

          <Animated.View entering={enterRise(1)}>
            <OTPView
              onFilled={onFilled}
              onResendCode={onSendCode}
              showButton={false}
              overrideStyle={themedStyles.otpView}
            />
          </Animated.View>

          <Animated.View entering={enterRise(2)}>
            <Text style={themedStyles.footerText}>
              <CustomText
                text={footerText}
                font="headline3"
                weight="regular"
                overrideStyle={themedStyles.footerText1}
              />
              <CustomText
                font="headline3"
                weight="semiBold"
                text={footerText2}
                onPress={onFooterPress}
                accessibilityRole="link"
                suppressHighlighting
                overrideStyle={themedStyles.footerText2}
              />
            </Text>
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
};

export default OTPVerificationScreen;
