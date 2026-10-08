import React, { useMemo } from "react";
import FastImage from "react-native-fast-image";
import { CachedImageProps } from "./CachedImage.types";
import { useThemeContext } from "contexts";

const CachedImage = ({ source, overrideStyle, children }: CachedImageProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const placeholderStyle = useMemo(
    () => ({ backgroundColor: colors.DIVIDER }),
    [colors]
  );

  return (
    <FastImage
      source={{ uri: source }}
      style={[placeholderStyle, overrideStyle]}
    >
      {children}
    </FastImage>
  );
};

export default CachedImage;
