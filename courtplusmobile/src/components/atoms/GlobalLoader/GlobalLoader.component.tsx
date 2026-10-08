import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { Images } from "theme";
import * as Progress from "react-native-progress";
import { useThemeContext } from "contexts";
import styles from "./GlobalLoader.styles";
import { horizontalScale } from "utils";
import { useAppStore } from "store";

const GlobalLoader = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const isLoading = useAppStore((state) => state.isLoading);

  if (!isLoading) return null;

  return (
    <View style={themedStyles.container}>
      <Progress.CircleSnail
        animated
        size={horizontalScale(177)}
        color={[colors.LIME, `${colors.LIME}00`]}
        style={themedStyles.progress}
      />
      <Image source={Images.logoGraph} style={themedStyles.logo} />
    </View>
  );
};

export default GlobalLoader;
