import React from "react";
import { Switch, View } from "react-native";
import { CustomSwitchProps } from "./CustomSwitch.types";
import { useThemeContext } from "contexts";
import styles from "./CustomSwitch.styles";

const CustomSwitch = ({
  value,
  onValueChange,
  overrideStyle,
}: CustomSwitchProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  return (
    <View style={overrideStyle}>
      <Switch
        style={styles.switch}
        value={value}
        trackColor={{ true: colors.BUTTON_GREEN }}
        thumbColor={colors.GREEN_YELLOWISH}
        onValueChange={onValueChange}
      />
    </View>
  );
};

export default CustomSwitch;
