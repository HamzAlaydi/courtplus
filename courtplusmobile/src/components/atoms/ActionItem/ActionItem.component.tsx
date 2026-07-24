import React, { useMemo } from "react";
import CustomText from "atoms/CustomText/CustomText.component";
import { Image, View } from "react-native";
import { ActionItemProps } from "./ActionItem.types";
import { useThemeContext } from "contexts";
import styles from "./ActionItem.styles";

const ActionItem = ({
  image,
  title,
  right,
  overrideStyle,
  overrideTitleStyle,
  overrideImageStyle,
}: ActionItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <View style={themedStyles.titleContainer}>
        <Image
          source={image}
          style={[themedStyles.image, overrideImageStyle]}
        />
        <CustomText
          text={title}
          font="headline3"
          weight="medium"
          overrideStyle={overrideTitleStyle}
        />
      </View>
      {right && right}
    </View>
  );
};

export default ActionItem;
