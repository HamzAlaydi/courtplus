import React, { useRef, useState } from "react";
import {
  ImageBackground,
  View,
  Image,
  Pressable,
} from "react-native";
import { OnboardingStepperProps } from "./OnboardingStepper.types";
import { CustomText, CustomButton } from "atoms/index";
import { useTranslation } from "react-i18next";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import { horizontalScale, verticalScale } from "utils";

/**
 * First-launch walkthrough.
 *
 * The previous version rendered a single static image, ignored `steps`
 * entirely, showed hard-coded English legal text twice and had a Skip
 * button that did nothing — the very first screen a customer saw.
 */
const OnboardingStepper = ({
  steps,
  onComplete,
  onSkip,
}: OnboardingStepperProps) => {
  const { t } = useTranslation();
  const { top, bottom } = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const isLast = page >= steps.length - 1;

  const onNext = () => {
    if (isLast) {
      onComplete?.();
      return;
    }
    pagerRef.current?.setPage(page + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A1517" }}>
      <View
        style={{
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: top + verticalScale(8),
        }}
      >
        <Image
          source={Images.horizontalLogo}
          style={{ width: 160, height: 46 }}
          resizeMode="contain"
        />
        <Pressable onPress={onSkip} hitSlop={12} accessibilityRole="button">
          <CustomText
            text={t("general.skip")}
            font="body"
            weight="semiBold"
            overrideStyle={{ color: "#C0FF42" }}
          />
        </Pressable>
      </View>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {steps.map((step, index) => (
          <View key={index} style={{ flex: 1 }}>
            <ImageBackground
              style={{ flex: 1, justifyContent: "flex-end" }}
              source={step.image}
              imageStyle={{ width: "100%", height: "100%" }}
            >
              <View
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: verticalScale(24),
                  gap: verticalScale(8),
                  backgroundColor: "rgba(10, 21, 23, 0.55)",
                }}
              >
                <CustomText
                  text={step.title}
                  font="headline3"
                  weight="bold"
                  overrideStyle={{ color: "white" }}
                />
                <CustomText
                  text={step.description}
                  font="body"
                  overrideStyle={{ color: "white", opacity: 0.85 }}
                />
              </View>
            </ImageBackground>
          </View>
        ))}
      </PagerView>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: horizontalScale(8),
          paddingVertical: verticalScale(16),
        }}
      >
        {steps.map((_, index) => (
          <View
            key={index}
            style={{
              width: index === page ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === page ? "#C0FF42" : "#2B3B3E",
            }}
          />
        ))}
      </View>

      <CustomButton
        title={isLast ? t("onboarding.getStarted") : t("general.next")}
        onPress={onNext}
        overrideStyle={{ marginHorizontal: 24 }}
      />
      <CustomText
        text={t("onboarding.terms")}
        font="body"
        overrideStyle={{
          color: "white",
          opacity: 0.7,
          textAlign: "center",
          marginHorizontal: 24,
          marginTop: verticalScale(12),
          marginBottom: bottom + verticalScale(12),
        }}
      />
    </View>
  );
};

export default OnboardingStepper;
