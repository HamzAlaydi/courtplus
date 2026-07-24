import { Header, WidgetWrapper } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

const TermsScreen = () => {
  const { t } = useTranslation();
  return (
    <MainWrapper scrollEnabled whiteBackground>
      <Header whiteColor title={t("settings.termsOfUse")} />
      <WidgetWrapper
        overrideStyle={{
          marginTop: 46,
        }}
      >
        <Text>{t("settings.termsOfUseHeadline")}</Text>
        <Text>{t("settings.termsOfUseContent")}</Text>
      </WidgetWrapper>
    </MainWrapper>
  );
};

export default TermsScreen;
