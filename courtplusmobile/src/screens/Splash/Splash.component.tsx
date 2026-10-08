import { useThemeContext } from "contexts";
import React, { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  ZoomIn,
} from "react-native-reanimated";
import styles from "./Splash.styles";
import { Images } from "theme";
import { StackActions, useNavigation } from "@react-navigation/native";
import { MainStackNavigationProp } from "navigation/types";
import { useAppStore } from "store";
import { useDisableBackHandler, useLocation } from "hooks";
import { useQuery } from "@tanstack/react-query";
import { MOTION, queryKeys } from "utils";

const LOGO_ENTER_MS = MOTION.enter * 2;

const ringEntering = FadeIn.duration(LOGO_ENTER_MS)
  .delay(MOTION.enter)
  .reduceMotion(ReduceMotion.System);

const fadeEntering = FadeIn.duration(LOGO_ENTER_MS).reduceMotion(
  ReduceMotion.System
);

const logoEntering = ZoomIn.duration(LOGO_ENTER_MS)
  .easing(Easing.out(Easing.cubic))
  .withInitialValues({ transform: [{ scale: 0.88 }] })
  .reduceMotion(ReduceMotion.System);

const SplashScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { dispatch } = useNavigation<MainStackNavigationProp>();
  const timerRef = useRef<NodeJS.Timeout>(null);
  const userTokens = useAppStore((state) => state.userTokens);
  const { getLocationDetails } = useLocation();
  useQuery({
    queryKey: [queryKeys.getUserLocation],
    queryFn: () => getLocationDetails(),
  });
  useDisableBackHandler();

  const handleNavigation = () => {
    if (userTokens.accessToken) {
      dispatch(StackActions.replace("AuthenticatedStack"));
    } else {
      dispatch(StackActions.replace("OnboardingStack"));
    }
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      handleNavigation();
    }, 5000);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  return (
    <View style={themedStyles.container}>
      <Animated.View entering={ringEntering} style={themedStyles.outerRing} />
      <Animated.View entering={ringEntering} style={themedStyles.ring} />
      <Animated.View entering={fadeEntering}>
        <Animated.Image
          entering={logoEntering}
          source={Images.logoGraph}
          style={themedStyles.image}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
};

export default SplashScreen;
