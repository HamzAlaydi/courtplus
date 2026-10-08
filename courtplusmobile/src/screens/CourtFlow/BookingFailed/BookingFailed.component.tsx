import { useNavigation } from "@react-navigation/native";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { useDisableBackHandler } from "hooks";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import { enterRise, MOTION, verticalScale } from "utils";
import styles from "./BookingFailed.styles";

const SHAKE_STEP = {
  duration: 70,
  easing: Easing.inOut(Easing.quad),
  reduceMotion: ReduceMotion.System,
} as const;

const badgeEntering = ZoomIn.springify()
  .damping(14)
  .stiffness(180)
  .reduceMotion(ReduceMotion.System);

const BookingFailedScreen = () => {
  const { t } = useTranslation();
  const { goBack } = useNavigation();
  useDisableBackHandler();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { top, bottom } = useSafeAreaInsets();
  const shake = useSharedValue(0);

  useEffect(() => {
    shake.value = withDelay(
      MOTION.enter + MOTION.state,
      withSequence(
        ReduceMotion.System,
        withTiming(-8, SHAKE_STEP),
        withTiming(8, SHAKE_STEP),
        withTiming(-5, SHAKE_STEP),
        withTiming(5, SHAKE_STEP),
        withTiming(0, SHAKE_STEP)
      ),
      ReduceMotion.System
    );
  }, [shake]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

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
      <View style={themedStyles.content}>
        <View style={themedStyles.halo}>
          <Animated.View style={shakeStyle}>
            <Animated.View entering={badgeEntering} style={themedStyles.badge}>
              <Image
                source={Images.close}
                style={themedStyles.icon}
                accessibilityIgnoresInvertColors
              />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View entering={enterRise(3)} style={themedStyles.texts}>
          <CustomText
            text={t("booking.bookingFailed")}
            font="displayHero"
            weight="extraBold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
          <CustomText
            text={t("messages.somethingWentWrong")}
            font="headline3"
            weight="regular"
            overrideStyle={themedStyles.subtitle}
          />
        </Animated.View>
      </View>

      <Animated.View entering={enterRise(5)}>
        <CustomButton
          variant="primary"
          title={t("booking.tryAgain")}
          onPress={goBack}
        />
      </Animated.View>
    </View>
  );
};

export default BookingFailedScreen;
