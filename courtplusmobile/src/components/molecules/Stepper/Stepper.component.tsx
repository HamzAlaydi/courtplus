import React, { Fragment, useMemo } from "react";
import { Image, View } from "react-native";
import { StepItem, StepperProps } from "./Stepper.types";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./Stepper.styles";
import { Images } from "theme";
import { StepperRegistry } from "./Stepper.registry";

const Stepper = ({ currentStep, flow, overrideStepStyle }: StepperProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const steps = StepperRegistry[flow];

  const renderCurrentStep = (step: StepItem) => {
    if (step.id === currentStep) {
      return (
        <View style={themedStyles.activeStep}>
          <CustomText text={step.name} font="fields" weight="medium" />
        </View>
      );
    }
    if (step.id < currentStep) {
      return (
        <View style={themedStyles.completedStep}>
          <Image source={Images.done} style={themedStyles.image} />
        </View>
      );
    }
    return (
      <View style={themedStyles.inactiveStep}>
        <CustomText
          text={step.name}
          font="fields"
          weight="medium"
          overrideStyle={themedStyles.inactiveStepText}
        />
      </View>
    );
  };

  return (
    <View style={[themedStyles.container, overrideStepStyle]}>
      {steps.map((step, index) => (
        <Fragment key={step.id}>
          {renderCurrentStep(step)}
          {index < steps.length - 1 && <View style={themedStyles.divider} />}
        </Fragment>
      ))}
    </View>
  );
};

export default Stepper;
