import { useThemeContext } from "contexts";
import React, { useEffect, useMemo, useRef } from "react";
import { Image, View } from "react-native";
import styles from "./Splash.styles";
import { Images } from "theme";
import { StackActions, useNavigation } from "@react-navigation/native";
import { MainStackNavigationProp } from "navigation/types";
import { useAppStore } from "store";
import { useDisableBackHandler, useLocation } from "hooks";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "utils";

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
      <Image source={Images.logoGraph} style={themedStyles.image} />
    </View>
  );
};

export default SplashScreen;
