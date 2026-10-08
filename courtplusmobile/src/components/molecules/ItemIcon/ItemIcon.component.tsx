import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { ItemIconProps } from "./ItemIcon.types";
import styles from "./ItemIcon.styles";
import { Images } from "theme";
import { useThemeContext } from "contexts";

const ItemIcon = ({
  icon,
  overrideStyle,
  overrideImageStyle,
}: ItemIconProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const finalImage = icon ? { uri: icon } : Images.maleProfile;

  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <Image
        source={finalImage}
        style={[themedStyles.image, overrideImageStyle]}
      />
    </View>
  );
};

export default ItemIcon;
