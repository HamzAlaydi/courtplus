import React, { useEffect, useMemo } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { CustomSwitchProps } from "./CustomSwitch.types";
import { useThemeContext } from "contexts";
import styles, { KNOB_TRAVEL } from "./CustomSwitch.styles";
import { isRTL, TOGGLE_SPRING } from "utils";

const CustomSwitch = ({
  value,
  onValueChange,
  overrideStyle,
}: CustomSwitchProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const progress = useSharedValue(value ? 1 : 0);
  const offColor = colors.HANDLE;
  const onColor = colors.INK;
  const direction = isRTL ? -1 : 1;

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, TOGGLE_SPRING);
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [offColor, onColor]
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * KNOB_TRAVEL * direction }],
  }));

  return (
    <View style={overrideStyle}>
      <Pressable
        onPress={() => onValueChange(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        hitSlop={8}
      >
        <Animated.View style={[themedStyles.track, trackStyle]}>
          <Animated.View style={[themedStyles.knob, knobStyle]} />
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default CustomSwitch;
