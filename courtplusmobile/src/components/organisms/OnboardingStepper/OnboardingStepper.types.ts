import { OnboardingItem } from "types";

export type OnboardingStepperProps = {
  steps: OnboardingItem[];
  onComplete?: () => void;
  onSkip?: () => void;
};
