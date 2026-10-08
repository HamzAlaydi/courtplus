import { Header } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React from "react";
import { useTranslation } from "react-i18next";
import DocumentContent from "./components/DocumentContent/DocumentContent.component";
import styles from "./Terms.styles";

const TermsScreen = () => {
  const { t } = useTranslation();
  return (
    <MainWrapper scrollEnabled overrideContentStyle={styles.content}>
      <Header whiteColor title={t("settings.termsOfUse")} />
      <DocumentContent
        headline={t("settings.termsOfUseHeadline")}
        content={t("settings.termsOfUseContent")}
      />
    </MainWrapper>
  );
};

export default TermsScreen;
