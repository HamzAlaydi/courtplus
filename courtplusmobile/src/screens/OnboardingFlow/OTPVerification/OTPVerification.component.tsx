import { useThemeContext } from "contexts";
import { Header, OTPView } from "molecules/index";
import React, { useMemo } from "react";
import { Image, ImageBackground, Text, View } from "react-native";
import { Images } from "theme";
import styles from "./OTPVerification.styles";
import { CustomText } from "atoms/index";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
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
          <Image source={Images.horizontalLogo} style={themedStyles.logo} />
        }
      />
      <KeyboardAwareScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        bounces={false}
        contentContainerStyle={themedStyles.keyboard}
      >
        <View style={themedStyles.bottomContainer}>
          <CustomText
            text={t("auth.verificationOtpLogin")}
            font="headline1"
            weight="semiBold"
            overrideStyle={themedStyles.title}
          />
          <Text style={themedStyles.codeContainer}>
            <CustomText
              text={t("auth.sendCode")}
              font="body"
              weight="medium"
              overrideStyle={themedStyles.codeText}
            />
            <CustomText
              text={phoneNumber}
              font="body"
              weight="medium"
              overrideStyle={themedStyles.codeText1}
            />
            <CustomText
              text={t("auth.checkMessages")}
              font="body"
              weight="medium"
              overrideStyle={themedStyles.codeText}
            />
          </Text>

          <OTPView
            onFilled={onFilled}
            onResendCode={onSendCode}
            showButton={false}
            overrideStyle={themedStyles.otpView}
          />

          <Text style={themedStyles.footerText}>
            <CustomText
              text={footerText}
              overrideStyle={themedStyles.footerText1}
            />
            <CustomText
              font="chip"
              weight="semiBold"
              text={footerText2}
              onPress={onFooterPress}
              overrideStyle={themedStyles.footerText2}
            />
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
};

export default OTPVerificationScreen;
