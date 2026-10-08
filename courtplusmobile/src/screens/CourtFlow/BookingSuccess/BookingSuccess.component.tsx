import { StackActions, useNavigation } from "@react-navigation/native";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { useDisableBackHandler } from "hooks";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  ReduceMotion,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ColorsType, Images, Radius } from "theme";
import { enterRise, horizontalScale, MOTION, verticalScale } from "utils";
import styles, { STAGE_SIZE } from "./BookingSuccess.styles";

type ConfettiTone = "LIME" | "WHITE" | "LIME_TINT" | "ON_INK_MUTED";

type ConfettiItem = {
  /** Resting offset from the centre of the badge, in design px. */
  x: number;
  y: number;
  /** Width and height in design px. */
  w: number;
  h: number;
  /** Resting rotation in degrees. */
  r: number;
  tone: ConfettiTone;
  round?: boolean;
};

const CONFETTI: ConfettiItem[] = [
  { x: -112, y: -92, w: 10, h: 10, r: 0, tone: "LIME", round: true },
  { x: 104, y: -104, w: 8, h: 8, r: 0, tone: "WHITE", round: true },
  { x: -136, y: 14, w: 6, h: 18, r: -32, tone: "LIME" },
  { x: 134, y: 26, w: 6, h: 18, r: 28, tone: "LIME_TINT" },
  { x: -88, y: 108, w: 7, h: 7, r: 0, tone: "ON_INK_MUTED", round: true },
  { x: 92, y: 112, w: 10, h: 10, r: 24, tone: "LIME" },
  { x: -34, y: -136, w: 5, h: 15, r: 16, tone: "WHITE" },
  { x: 40, y: -132, w: 7, h: 7, r: 0, tone: "LIME", round: true },
  { x: 146, y: -46, w: 7, h: 7, r: 45, tone: "WHITE" },
  { x: -150, y: -44, w: 8, h: 8, r: 14, tone: "LIME_TINT" },
  { x: 18, y: 140, w: 5, h: 15, r: -20, tone: "LIME" },
];

const BURST_SPRING = {
  damping: 14,
  stiffness: 90,
  mass: 0.9,
  reduceMotion: ReduceMotion.System,
} as const;

const RIPPLE_TIMING = {
  duration: 1800,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
} as const;

const badgeEntering = ZoomIn.springify()
  .damping(11)
  .stiffness(160)
  .delay(MOTION.stagger * 2)
  .reduceMotion(ReduceMotion.System);

const checkEntering = ZoomIn.duration(MOTION.enter)
  .delay(MOTION.enter)
  .easing(Easing.out(Easing.back(2)))
  .reduceMotion(ReduceMotion.System);

const ConfettiPiece = ({
  item,
  progress,
  colors,
}: {
  item: ConfettiItem;
  progress: SharedValue<number>;
  colors: ColorsType;
}) => {
  const width = horizontalScale(item.w);
  const height = horizontalScale(item.h);
  const x = horizontalScale(item.x);
  const y = horizontalScale(item.y);

  const pieceStyle: ViewStyle = {
    position: "absolute",
    top: STAGE_SIZE / 2 - height / 2,
    start: STAGE_SIZE / 2 - width / 2,
    width,
    height,
    borderRadius: item.round ? Radius.pill : horizontalScale(2),
    backgroundColor: colors[item.tone],
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 1], [0, 1, 1]),
    transform: [
      { translateX: x * progress.value },
      { translateY: y * progress.value },
      { rotate: `${item.r * progress.value}deg` },
      { scale: interpolate(progress.value, [0, 1], [0.3, 1]) },
    ],
  }));

  return <Animated.View style={[pieceStyle, animatedStyle]} />;
};

const Ripple = ({
  progress,
  style,
}: {
  progress: SharedValue<number>;
  style: ViewStyle;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 0.55, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.75]) }],
  }));

  return <Animated.View pointerEvents="none" style={[style, animatedStyle]} />;
};

const BookingSuccessScreen = () => {
  const { t } = useTranslation();
  useDisableBackHandler();
  const { dispatch } = useNavigation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { top, bottom } = useSafeAreaInsets();

  const burst = useSharedValue(0);
  const rippleA = useSharedValue(0);
  const rippleB = useSharedValue(0);

  useEffect(() => {
    burst.value = withDelay(
      MOTION.enter,
      withSpring(1, BURST_SPRING),
      ReduceMotion.System
    );
    rippleA.value = withDelay(
      MOTION.enter,
      withRepeat(
        withTiming(1, RIPPLE_TIMING),
        3,
        false,
        undefined,
        ReduceMotion.System
      ),
      ReduceMotion.System
    );
    rippleB.value = withDelay(
      MOTION.enter + 900,
      withRepeat(
        withTiming(1, RIPPLE_TIMING),
        2,
        false,
        undefined,
        ReduceMotion.System
      ),
      ReduceMotion.System
    );
  }, [burst, rippleA, rippleB]);

  const onPress = () => {
    dispatch(StackActions.popToTop());
  };

  const subtitle = t("booking.bookingSuccessSubtitle", { defaultValue: "" });

  return (
    <View
      style={[
        themedStyles.container,
        {
          paddingTop: top + verticalScale(24),
          paddingBottom: bottom + verticalScale(20),
        },
      ]}
    >
      <StatusBar barStyle="light-content" />
      <View style={themedStyles.content}>
        <View style={themedStyles.stage}>
          <View style={themedStyles.haloOuter} />
          <View style={themedStyles.haloInner} />
          <Ripple progress={rippleA} style={themedStyles.ripple} />
          <Ripple progress={rippleB} style={themedStyles.ripple} />
          {CONFETTI.map((item, index) => (
            <ConfettiPiece
              key={`confetti-${index}`}
              item={item}
              progress={burst}
              colors={colors}
            />
          ))}
          <Animated.View entering={badgeEntering} style={themedStyles.badge}>
            <Animated.Image
              entering={checkEntering}
              source={Images.done}
              style={themedStyles.checkIcon}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </View>

        <Animated.View entering={enterRise(4)} style={themedStyles.texts}>
          <CustomText
            text={t("booking.bookingSuccess")}
            font="displayHero"
            weight="extraBold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
          {!!subtitle && (
            <CustomText
              text={subtitle}
              font="headline3"
              weight="regular"
              overrideStyle={themedStyles.subtitle}
            />
          )}
        </Animated.View>
      </View>

      <Animated.View entering={enterRise(6)}>
        <CustomButton
          variant="primary"
          title={t("booking.okContinue")}
          onPress={onPress}
        />
      </Animated.View>
    </View>
  );
};

export default BookingSuccessScreen;
