import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Slider as RNSlider } from "react-native-awesome-slider";
import styles from "./Slider.styles";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { isRTL } from "utils";
import { SliderProps } from "./Slider.types";

const Slider = ({ onValueChange, value }: SliderProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const progress = useSharedValue(value);
  const min = useSharedValue(0);
  const max = useSharedValue(100);

  return (
    <RNSlider
      theme={{
        minimumTrackTintColor: colors.GREEN_YELLOWISH,
      }}
      renderThumb={() => <View style={themedStyles.thumb} />}
      progress={progress}
      minimumValue={min}
      maximumValue={max}
      isRTL={isRTL}
      onValueChange={onValueChange}
      renderBubble={() => <View />}
    />
  );
};

export default Slider;
