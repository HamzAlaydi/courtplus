import React from "react";
import { StatusBar } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  CompleteProfileScreen,
  LoginScreen,
  OnboardingScreen,
  OTPVerificationScreen,
  RecoverAccountScreen,
  RegisterScreen,
  WelcomeScreen,
} from "screens";
import { OnboardingStackParamList } from "./types";
import { useAppStore } from "store";

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStackNavigator = () => {
  const firstVisit = useAppStore((state) => state.firstVisit);
  return (
    <>
      <StatusBar barStyle="light-content" />
      <OnboardingStack.Navigator
        initialRouteName={firstVisit ? "Welcome" : "Login"}
        screenOptions={{ headerShown: false }}
      >
        <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
        <OnboardingStack.Screen
          name="Onboarding"
          component={OnboardingScreen}
        />
        <OnboardingStack.Screen name="Login" component={LoginScreen} />
        <OnboardingStack.Screen
          name="OTPVerification"
          component={OTPVerificationScreen}
        />
        <OnboardingStack.Screen name="Register" component={RegisterScreen} />
        <OnboardingStack.Screen
          name="RecoverAccount"
          component={RecoverAccountScreen}
        />
        <OnboardingStack.Screen
          name="CompleteProfile"
          component={CompleteProfileScreen}
          options={{
            gestureEnabled: false,
          }}
        />
      </OnboardingStack.Navigator>
    </>
  );
};
