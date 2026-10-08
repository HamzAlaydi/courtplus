import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header, OTPView } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import { enterRise } from "utils";
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
    <MainWrapper>
      <Header whiteColor title={t("changePhone.verifyPhone")} />
      <Animated.View entering={enterRise(0)} style={themedStyles.content}>
        <View style={themedStyles.intro}>
          <View style={themedStyles.iconBadge}>
            <Image source={Images.lock} style={themedStyles.icon} />
          </View>
          <CustomText
            text={t("changePhone.verifyPhone")}
            font="cardTitle"
            weight="bold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
        </View>
        <OTPView
          onFilled={onFilled}
          onResendCode={onResendCode}
          overrideStyle={themedStyles.otpView}
          showButton={false}
          isDark
        />
      </Animated.View>
    </MainWrapper>
  );
};

export default VerifyPhoneScreen;
