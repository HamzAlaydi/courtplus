import { StyleProp, ViewStyle } from "react-native";
import { StepperFlow } from "./Stepper.registry";

export type StepItem = {
  id: number;
  name: string;
};

export type StepperProps = {
  flow: StepperFlow;
  currentStep: number;
  overrideStepStyle?: StyleProp<ViewStyle>;
};
