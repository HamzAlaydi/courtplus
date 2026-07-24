import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types";
import { OnboardingStackNavigator } from "./OnboardingStack";
import { AuthenticatedStackNavigator } from "./AuthenticatedStack";
import { SplashScreen } from "screens";

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="OnboardingStack"
        component={OnboardingStackNavigator}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="AuthenticatedStack"
        component={AuthenticatedStackNavigator}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
};
