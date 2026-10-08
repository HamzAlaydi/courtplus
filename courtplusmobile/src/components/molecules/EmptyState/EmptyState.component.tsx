import React, { useMemo } from "react";
import { Image } from "react-native";
import Animated from "react-native-reanimated";
import { EmptyStateProps } from "./EmptyState.types";
import styles from "./EmptyState.styles";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { enterRise } from "utils";

const EmptyState = ({
  image,
  title,
  subtitle,
  buttonTitle,
  onButtonPress,
  overrideStyle,
  overrideImageStyle,
}: EmptyStateProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <Animated.View
      entering={enterRise(0)}
      style={[themedStyles.container, overrideStyle]}
    >
      <Image source={image} style={[themedStyles.image, overrideImageStyle]} />
      <CustomText
        text={title}
        font="cardTitle"
        weight="bold"
        overrideStyle={themedStyles.text}
      />
      {!!subtitle && (
        <CustomText
          text={subtitle}
          font="caption"
          weight="regular"
          overrideStyle={themedStyles.subtitle}
        />
      )}
      {!!buttonTitle && !!onButtonPress && (
        <CustomButton
          variant="secondary"
          size="medium"
          title={buttonTitle}
          onPress={onButtonPress}
          overrideStyle={themedStyles.button}
        />
      )}
    </Animated.View>
  );
};

export default EmptyState;
