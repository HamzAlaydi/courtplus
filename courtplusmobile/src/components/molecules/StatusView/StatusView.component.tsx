import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enterFade, enterRise, verticalScale } from "utils";
import { StatusViewProps } from "./StatusView.types";
import styles from "./StatusView.styles";

const StatusView = ({
  image,
  title,
  buttonTitle,
  onButtonPress,
  overrideStyle,
  secondImage,
}: StatusViewProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        themedStyles.container,
        { paddingBottom: bottom + verticalScale(20) },
        overrideStyle,
      ]}
    >
      <View style={themedStyles.content}>
        <Animated.View entering={enterFade(0)} style={themedStyles.imageRing}>
          <Image source={image} style={themedStyles.image} />
          {secondImage && (
            <Image source={secondImage} style={themedStyles.secondImage} />
          )}
        </Animated.View>

        <Animated.View entering={enterRise(2)}>
          <CustomText
            text={title}
            font="displayHero"
            weight="extraBold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
        </Animated.View>
      </View>
      <Animated.View entering={enterRise(4)}>
        <CustomButton
          variant="primary"
          title={buttonTitle}
          onPress={onButtonPress}
        />
      </Animated.View>
    </View>
  );
};

export default StatusView;
