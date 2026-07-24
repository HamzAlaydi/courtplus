import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { EmptyStateProps } from "./EmptyState.types";
import styles from "./EmptyState.styles";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";

const EmptyState = ({
  image,
  title,
  overrideStyle,
  overrideImageStyle,
}: EmptyStateProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), []);
  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <Image source={image} style={overrideImageStyle} />
      <CustomText
        text={title}
        font="headline3"
        weight="semiBold"
        overrideStyle={themedStyles.text}
      />
    </View>
  );
};

export default EmptyState;
