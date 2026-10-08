import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImageBackground, View, Image } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { OnboardingStepperProps } from "./OnboardingStepper.types";
import { CustomText, CustomButton, PressableScale } from "atoms/index";
import { useTranslation } from "react-i18next";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "contexts";
import { Images } from "theme";
import { OnboardingItem } from "types";
import {
  enterDrop,
  enterRise,
  horizontalScale,
  MOTION,
  STATE_TIMING,
  verticalScale,
} from "utils";
import styles from "./OnboardingStepper.styles";

type ThemedStyles = ReturnType<typeof styles>;

const DOT_SIZE = horizontalScale(6);
const DOT_ACTIVE_SIZE = horizontalScale(26);

const SLIDE_TIMING = {
  duration: MOTION.enter,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

const OnboardingSlide = ({
  step,
  isActive,
  themedStyles,
  shade,
}: {
  step: OnboardingItem;
  isActive: boolean;
  themedStyles: ThemedStyles;
  shade: string[];
}) => {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, SLIDE_TIMING);
  }, [isActive, progress]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.25, 1]),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [MOTION.rise * 1.6, 0]),
      },
    ],
  }));

  return (
    <ImageBackground
      style={themedStyles.image}
      source={step.image}
      imageStyle={themedStyles.imageStyle}
    >
      <LinearGradient colors={shade} style={themedStyles.pageShade} />
      <Animated.View entering={enterRise(1)}>
        <Animated.View style={[themedStyles.slideContent, textStyle]}>
          <CustomText
            text={step.title}
            font="displayHero"
            weight="extraBold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
          <CustomText
            text={step.description}
            font="headline3"
            weight="regular"
            overrideStyle={themedStyles.description}
          />
        </Animated.View>
      </Animated.View>
    </ImageBackground>
  );
};

const PageDot = ({
  isActive,
  inactiveColor,
  activeColor,
  style,
}: {
  isActive: boolean;
  inactiveColor: string;
  activeColor: string;
  style: ThemedStyles["dot"];
}) => {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, STATE_TIMING);
  }, [isActive, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [DOT_SIZE, DOT_ACTIVE_SIZE]),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor]
    ),
  }));

  return <Animated.View style={[style, animatedStyle]} />;
};

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
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { top, bottom } = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const isLast = page >= steps.length - 1;

  const pageShade = useMemo(
    () => [`${colors.INK}00`, `${colors.INK}B3`, colors.INK],
    [colors]
  );
  const headerShade = useMemo(
    () => [`${colors.INK}B3`, `${colors.INK}00`],
    [colors]
  );

  const onNext = () => {
    if (isLast) {
      onComplete?.();
      return;
    }
    pagerRef.current?.setPage(page + 1);
  };

  return (
    <View style={themedStyles.container}>
      <PagerView
        ref={pagerRef}
        style={themedStyles.pager}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {steps.map((step, index) => (
          <View key={index} style={themedStyles.page}>
            <OnboardingSlide
              step={step}
              isActive={index === page}
              themedStyles={themedStyles}
              shade={pageShade}
            />
          </View>
        ))}
      </PagerView>

      <LinearGradient
        colors={headerShade}
        style={themedStyles.headerShade}
        pointerEvents="none"
      />
      <Animated.View
        entering={enterDrop(0)}
        style={[themedStyles.header, { paddingTop: top + verticalScale(8) }]}
      >
        <Image
          source={Images.horizontalLogo}
          style={themedStyles.logo}
          accessibilityIgnoresInvertColors
        />
        <PressableScale
          onPress={onSkip}
          hitSlop={8}
          accessibilityRole="button"
          style={themedStyles.skipButton}
        >
          <CustomText
            text={t("general.skip")}
            font="headline3"
            weight="semiBold"
            overrideStyle={themedStyles.skipText}
          />
        </PressableScale>
      </Animated.View>

      <Animated.View
        entering={enterRise(2)}
        style={[
          themedStyles.footer,
          { paddingBottom: bottom + verticalScale(12) },
        ]}
      >
        <View style={themedStyles.dots}>
          {steps.map((_, index) => (
            <PageDot
              key={index}
              isActive={index === page}
              inactiveColor={colors.ON_INK_LINE}
              activeColor={colors.LIME}
              style={themedStyles.dot}
            />
          ))}
        </View>

        <CustomButton
          variant="primary"
          title={isLast ? t("onboarding.getStarted") : t("general.next")}
          onPress={onNext}
        />
        <CustomText
          text={t("onboarding.terms")}
          font="caption"
          weight="regular"
          overrideStyle={themedStyles.terms}
        />
      </Animated.View>
    </View>
  );
};

export default OnboardingStepper;
