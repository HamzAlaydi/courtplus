import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  ImageBackground,
  useWindowDimensions,
  View,
  StatusBar,
  Pressable,
  Image,
  Text,
} from "react-native";
import { OnboardingStepperProps } from "./OnboardingStepper.types";
import { OnboardingItem } from "types";
import { CustomText, CustomButton } from "atoms/index";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import styles from "./OnboardingStepper.styles";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import { horizontalScale, verticalScale } from "utils";

const OnboardingStepper = ({
  steps,
  onComplete,
  onSkip,
}: OnboardingStepperProps) => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { top, bottom } = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0A1517",
      }}
    >
      <View
        style={{
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          gap: horizontalScale(20),
          paddingTop: top,
        }}
      >
        <View
          style={{
            height: 40,
            width: 40,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#142326",
            borderRadius: 40,
          }}
        >
          {/* <ArrowLeft /> */}
        </View>
        <Image
          source={Images.horizontalLogo}
          style={{ width: 207, height: 60 }}
        />
      </View>
      <ImageBackground
        style={{ flex: 1, justifyContent: "center" }}
        source={Images.onboarding1}
        imageStyle={{
          width: "100%",
          height: "100%",
        }}
      >
        <Text style={{ color: "white", marginHorizontal: 24 }}>
          By starting, you agree to our Terms of Service Privacy Policy
        </Text>
      </ImageBackground>

      <CustomButton
        title={t("general.skip")}
        onPress={() => {}}
        overrideStyle={{ marginHorizontal: 24, marginBottom: 24 }}
      />
      <Text style={{ color: "white", marginHorizontal: 24 }}>
        By starting, you agree to our Terms of Service Privacy Policy
      </Text>
    </View>
  );
};

export default OnboardingStepper;
