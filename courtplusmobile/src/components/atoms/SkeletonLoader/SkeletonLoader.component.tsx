import React from "react";
import { View } from "react-native";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { horizontalScale, spacing, verticalScale } from "utils";
import { useThemeContext } from "contexts";
import { Radius } from "theme";
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
          backgroundColor: colors.GROUND,
        },
        overrideContainerStyle,
      ]}
    >
      <SkeletonPlaceholder
        speed={1100}
        borderRadius={Radius.input}
        backgroundColor={colors.LINE}
        highlightColor={colors.SUBTLE}
      >
        <>
          <SkeletonPlaceholder.Item
            height={verticalScale(150)}
            borderRadius={Radius.card}
          />
          <SkeletonPlaceholder.Item
            marginTop={spacing[12]}
            width="60%"
            height={horizontalScale(16)}
          />
          <SkeletonPlaceholder.Item
            marginTop={spacing[8]}
            width="40%"
            height={horizontalScale(12)}
          />
          <SkeletonPlaceholder.Item
            marginTop={spacing[20]}
            height={horizontalScale(64)}
            borderRadius={Radius.tile}
          />
          <SkeletonPlaceholder.Item
            marginTop={spacing[12]}
            height={horizontalScale(64)}
            borderRadius={Radius.tile}
          />
        </>
      </SkeletonPlaceholder>
    </View>
  );
};

export default SkeletonLoader;
