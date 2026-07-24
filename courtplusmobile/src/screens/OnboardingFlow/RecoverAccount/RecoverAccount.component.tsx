import { useThemeContext } from "contexts";
import { Header } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./RecoverAccount.styles";
import { CustomButton, CustomText } from "atoms/index";
import { useTranslation } from "react-i18next";
import { useRecoverAccount } from "./RecoverAccount.logic";

const RecoverAccountScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { onRestoreAccount, onStartFresh } = useRecoverAccount();

  return (
    <MainWrapper scrollEnabled whiteBackground>
      <Header whiteColor />
      <Image source={Images.tennisRacket} style={themedStyles.image} />
      <View style={themedStyles.centeredContainer}>
        <CustomText
          font="headline1"
          text={t("recoverAccount.welcomeBack")}
          weight="semiBold"
        />
        <CustomText
          font="headline3"
          weight="medium"
          overrideStyle={themedStyles.description}
          text={t("recoverAccount.description")}
        />
      </View>
      <View style={themedStyles.bottomContainer}>
        <CustomButton
          variant="dark"
          title={t("recoverAccount.restoreAccount")}
          onPress={onRestoreAccount}
        />
        <CustomButton
          title={t("recoverAccount.startFresh")}
          onPress={onStartFresh}
          overrideStyle={themedStyles.startFreshButton}
          variant="link"
        />
      </View>
    </MainWrapper>
  );
};

export default RecoverAccountScreen;
