import React, { useMemo } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { MainStack } from "./MainStack";
import { navigationRef } from "./types";
import { useThemeContext } from "contexts";

export default function MainNavigation() {
  const {
    currentTheme: { colors },
  } = useThemeContext();

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: colors.INK,
        background: colors.GROUND,
        card: colors.CARD,
        text: colors.INK,
        border: colors.LINE,
      },
    }),
    [colors]
  );

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <MainStack />
    </NavigationContainer>
  );
}
