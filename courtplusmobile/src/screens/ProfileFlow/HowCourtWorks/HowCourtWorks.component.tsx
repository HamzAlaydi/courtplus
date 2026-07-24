import { Header, WidgetWrapper } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

const HowCourtWorksScreen = () => {
  const { t } = useTranslation();

  return (
    <MainWrapper scrollEnabled whiteBackground>
      <Header whiteColor title={t("settings.howCourtWorks")} />
      <WidgetWrapper
        overrideStyle={{
          marginTop: 46,
        }}
      >
        <Text>{t("settings.howCourtWorksHeadline")}</Text>
        <Text>{t("settings.howCourtWorksContent")}</Text>
      </WidgetWrapper>
    </MainWrapper>
  );
};

export default HowCourtWorksScreen;
