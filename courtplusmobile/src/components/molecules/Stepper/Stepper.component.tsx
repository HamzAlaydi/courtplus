import React, { Fragment, useMemo } from "react";
import { Image, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  ZoomIn,
} from "react-native-reanimated";
import { StepItem, StepperProps } from "./Stepper.types";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./Stepper.styles";
import { Images } from "theme";
import { MOTION } from "utils";
import { StepperRegistry } from "./Stepper.registry";

const activeEntering = ZoomIn.duration(MOTION.enter)
  .easing(Easing.out(Easing.back(1.6)))
  .withInitialValues({ transform: [{ scale: 0.7 }] })
  .reduceMotion(ReduceMotion.System);

const Stepper = ({ currentStep, flow, overrideStepStyle }: StepperProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const steps = StepperRegistry[flow];

  const renderCurrentStep = (step: StepItem) => {
    if (step.id === currentStep) {
      return (
        <Animated.View
          entering={activeEntering}
          style={themedStyles.activeStep}
        >
          <CustomText
            text={step.name}
            font="dayNumber"
            weight="bold"
            overrideStyle={themedStyles.activeStepText}
          />
        </Animated.View>
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
          font="dayNumber"
          weight="bold"
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
          {index < steps.length - 1 && (
            <View
              style={[
                themedStyles.divider,
                step.id < currentStep && themedStyles.completedDivider,
              ]}
            />
          )}
        </Fragment>
      ))}
    </View>
  );
};

export default Stepper;
