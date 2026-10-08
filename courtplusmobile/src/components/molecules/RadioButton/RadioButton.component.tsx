import { CustomText, PressableScale } from "atoms/index";
import React, { useMemo } from "react";
import { View } from "react-native";
import Animated, { ReduceMotion, ZoomIn } from "react-native-reanimated";
import { RadioButtonProps } from "./RadioButton.types";
import { useThemeContext } from "contexts";
import { TOGGLE_SPRING } from "utils";
import styles from "./RadioButton.styles";

const dotEntering = ZoomIn.springify()
  .damping(TOGGLE_SPRING.damping)
  .stiffness(TOGGLE_SPRING.stiffness)
  .mass(TOGGLE_SPRING.mass)
  .reduceMotion(ReduceMotion.System);

/**
 * `isDark` is true on light surfaces (ink text, ink selected circle).
 * Otherwise the row sits on a dark sheet (white text, lime selected circle).
 */
const RadioButton = ({
  title,
  isSelected,
  onPress,
  overrideStyle,
  isDark = false,
}: RadioButtonProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors, isDark), [colors, isDark]);
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, selected: isSelected }}
      style={[themedStyles.container, overrideStyle]}
    >
      <CustomText
        font="cardTitle"
        weight="semiBold"
        text={title}
        overrideStyle={themedStyles.title}
      />
      <View style={[themedStyles.radio, isSelected && themedStyles.radioOn]}>
        {isSelected && (
          <Animated.View entering={dotEntering} style={themedStyles.selected} />
        )}
      </View>
    </PressableScale>
  );
};

export default RadioButton;
