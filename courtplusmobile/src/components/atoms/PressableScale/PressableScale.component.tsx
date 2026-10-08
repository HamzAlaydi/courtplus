import React, { forwardRef, useCallback } from "react";
import { GestureResponderEvent, Pressable, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { MOTION, PRESS_SPRING } from "utils";
import { PressableScaleProps } from "./PressableScale.types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PressableScale = forwardRef<View, PressableScaleProps>(
  (
    {
      style,
      scaleTo = MOTION.pressScale,
      disableScale = false,
      disabled,
      onPressIn,
      onPressOut,
      children,
      ...props
    },
    ref
  ) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(
      (event: GestureResponderEvent) => {
        if (!disableScale) {
          scale.value = withTiming(scaleTo, {
            duration: MOTION.press,
            reduceMotion: ReduceMotion.System,
          });
        }
        onPressIn?.(event);
      },
      [disableScale, onPressIn, scale, scaleTo]
    );

    const handlePressOut = useCallback(
      (event: GestureResponderEvent) => {
        scale.value = withSpring(1, PRESS_SPRING);
        onPressOut?.(event);
      },
      [onPressOut, scale]
    );

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[style, animatedStyle]}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }
);

export default PressableScale;
