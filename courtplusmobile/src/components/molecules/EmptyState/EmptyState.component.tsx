import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { EmptyStateProps } from "./EmptyState.types";
import styles from "./EmptyState.styles";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";

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
    <View style={[themedStyles.container, overrideStyle]}>
      <Image source={image} style={overrideImageStyle} />
      <CustomText
        text={title}
        font="headline3"
        weight="semiBold"
        overrideStyle={themedStyles.text}
      />
      {!!subtitle && (
        <CustomText
          text={subtitle}
          font="chip"
          weight="regular"
          overrideStyle={themedStyles.subtitle}
        />
      )}
      {!!buttonTitle && !!onButtonPress && (
        <CustomButton
          variant="dark"
          title={buttonTitle}
          onPress={onButtonPress}
          overrideStyle={themedStyles.button}
        />
      )}
    </View>
  );
};

export default EmptyState;
