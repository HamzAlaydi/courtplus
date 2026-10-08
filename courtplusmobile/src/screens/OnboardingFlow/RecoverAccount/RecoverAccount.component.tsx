import { useThemeContext } from "contexts";
import { Header } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import styles from "./RecoverAccount.styles";
import { CustomButton, CustomText } from "atoms/index";
import { useTranslation } from "react-i18next";
import { enterRise } from "utils";
import { useRecoverAccount } from "./RecoverAccount.logic";

const RecoverAccountScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { onRestoreAccount, onStartFresh } = useRecoverAccount();

  return (
    <MainWrapper scrollEnabled>
      <Header whiteColor />
      <Animated.View entering={enterRise(0)} style={themedStyles.hero}>
        <View style={themedStyles.disc} />
        <Image
          source={Images.tennisRacket}
          style={themedStyles.image}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
      <Animated.View
        entering={enterRise(1)}
        style={themedStyles.centeredContainer}
      >
        <CustomText
          font="displayHero"
          weight="extraBold"
          accessibilityRole="header"
          text={t("recoverAccount.welcomeBack")}
          overrideStyle={themedStyles.title}
        />
        <CustomText
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.description}
          text={t("recoverAccount.description")}
        />
      </Animated.View>
      <Animated.View
        entering={enterRise(2)}
        style={themedStyles.bottomContainer}
      >
        <CustomButton
          variant="primary"
          title={t("recoverAccount.restoreAccount")}
          onPress={onRestoreAccount}
        />
        <CustomButton
          title={t("recoverAccount.startFresh")}
          onPress={onStartFresh}
          overrideStyle={themedStyles.startFreshButton}
          variant="link"
        />
      </Animated.View>
    </MainWrapper>
  );
};

export default RecoverAccountScreen;
