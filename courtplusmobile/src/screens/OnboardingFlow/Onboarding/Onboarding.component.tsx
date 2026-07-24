import { OnboardingStepper } from "organisms/index";
import React from "react";
import { Images } from "theme";

const OnboardingScreen = () => {
  return (
    <OnboardingStepper
      steps={[
        {
          image: Images.onboarding1,
          title: "Onboarding 1",
          description: "Onboarding 1 description",
        },
        {
          image: Images.onboarding1,
          title: "Onboarding 2",
          description: "Onboarding 1 description",
        },
        {
          image: Images.onboarding1,
          title: "Onboarding 3",
          description: "Onboarding 1 description",
        },
      ]}
    />
  );
};

export default OnboardingScreen;
