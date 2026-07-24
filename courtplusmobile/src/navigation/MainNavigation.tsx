import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { MainStack } from "./MainStack";
import { navigationRef } from "./types";

export default function MainNavigation() {
  return (
    <NavigationContainer ref={navigationRef}>
      <MainStack />
    </NavigationContainer>
  );
}
