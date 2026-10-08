import { Header } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React from "react";
import { useTranslation } from "react-i18next";
import DocumentContent from "../Terms/components/DocumentContent/DocumentContent.component";
import styles from "./HowCourtWorks.styles";

const HowCourtWorksScreen = () => {
  const { t } = useTranslation();

  return (
    <MainWrapper scrollEnabled overrideContentStyle={styles.content}>
      <Header whiteColor title={t("settings.howCourtWorks")} />
      <DocumentContent
        headline={t("settings.howCourtWorksHeadline")}
        content={t("settings.howCourtWorksContent")}
      />
    </MainWrapper>
  );
};

export default HowCourtWorksScreen;
