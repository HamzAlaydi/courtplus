import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header, OTPView } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import styles from "./VerifyPhone.styles";
import { useVerifyPhone } from "./VerifyPhone.logic";

const VerifyPhoneScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { onFilled, onResendCode } = useVerifyPhone();
  return (
    <MainWrapper whiteBackground>
      <Header whiteColor title={t("changePhone.verifyPhone")} />
      <View style={themedStyles.content}>
        <CustomText
          text={t("changePhone.verifyPhone")}
          font="headline1"
          weight="bold"
        />
        <OTPView
          onFilled={onFilled}
          onResendCode={onResendCode}
          overrideStyle={themedStyles.otpView}
          showButton={false}
          isDark
        />
      </View>
    </MainWrapper>
  );
};

export default VerifyPhoneScreen;
