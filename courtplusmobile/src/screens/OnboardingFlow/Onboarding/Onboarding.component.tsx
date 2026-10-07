import { useNavigation } from "@react-navigation/native";
import { OnboardingStackNavigationProp } from "navigation/types";
import { OnboardingStepper } from "organisms/index";
import React from "react";
import { useTranslation } from "react-i18next";
import { Images } from "theme";

const OnboardingScreen = () => {
  const { t } = useTranslation();
  const { navigate } = useNavigation<OnboardingStackNavigationProp>();
  // Both paths end on Login; a returning customer signs in, a new one taps
  // Sign up from there.
  const finish = () => navigate("Login");

  return (
    <OnboardingStepper
      steps={[
        {
          image: Images.onboarding1,
          title: t("onboarding.title1"),
          description: t("onboarding.description1"),
        },
        {
          image: Images.onboarding1,
          title: t("onboarding.title2"),
          description: t("onboarding.description2"),
        },
        {
          image: Images.onboarding1,
          title: t("onboarding.title3"),
          description: t("onboarding.description3"),
        },
      ]}
      onSkip={finish}
      onComplete={finish}
    />
  );
};

export default OnboardingScreen;
