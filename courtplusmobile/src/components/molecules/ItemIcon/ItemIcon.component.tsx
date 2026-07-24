import React from "react";
import { Image, View } from "react-native";
import { ItemIconProps } from "./ItemIcon.types";
import styles from "./ItemIcon.styles";
import { Images } from "theme";

const ItemIcon = ({
  icon,
  overrideStyle,
  overrideImageStyle,
}: ItemIconProps) => {
  const finalImage = icon ? { uri: icon } : Images.maleProfile;

  return (
    <View style={[styles.container, overrideStyle]}>
      <Image source={finalImage} style={[styles.image, overrideImageStyle]} />
    </View>
  );
};

export default ItemIcon;
