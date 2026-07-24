import React from "react";
import { View } from "react-native";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { horizontalScale, spacing } from "utils";
import { useThemeContext } from "contexts";
import styles from "./SkeletonLoader.styles";
import { SkeletonLoaderProps } from "./SkeletonLoader.types";

const SkeletonLoader = ({ overrideContainerStyle }: SkeletonLoaderProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.WHITE,
        },
        overrideContainerStyle,
      ]}
    >
      <SkeletonPlaceholder speed={1000} borderRadius={6}>
        <>
          <SkeletonPlaceholder.Item
            marginTop={spacing[6]}
            height={horizontalScale(45)}
          />
          <SkeletonPlaceholder.Item
            marginTop={spacing[6]}
            height={horizontalScale(100)}
          />
          <SkeletonPlaceholder.Item
            marginTop={spacing[6]}
            height={horizontalScale(45)}
          />
          <SkeletonPlaceholder.Item
            marginTop={spacing[6]}
            height={horizontalScale(45)}
          />
        </>
      </SkeletonPlaceholder>
    </View>
  );
};

export default SkeletonLoader;
