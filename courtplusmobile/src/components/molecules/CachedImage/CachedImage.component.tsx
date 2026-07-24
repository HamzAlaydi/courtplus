import React from "react";
import FastImage from "react-native-fast-image";
import { CachedImageProps } from "./CachedImage.types";

const CachedImage = ({ source, overrideStyle, children }: CachedImageProps) => {
  return (
    <FastImage source={{ uri: source }} style={overrideStyle}>
      {children}
    </FastImage>
  );
};

export default CachedImage;
