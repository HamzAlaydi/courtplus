import { CustomButton } from "atoms/index";
import React, { useMemo } from "react";
import { View } from "react-native";
import { ButtonsRowProps } from "./ButtonsRow.types";
import styles from "./ButtonsRow.styles";
import { useThemeContext } from "contexts";

const ButtonsRow = ({
  onPress,
  onSecondaryPress,
  title,
  secondaryTitle,
  overrideStyle,
  buttonDisabled,
  secondaryButtonDisabled,
}: ButtonsRowProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <View style={[themedStyles.buttonContainer, overrideStyle]}>
      <CustomButton
        title={title}
        onPress={onPress}
        overrideStyle={themedStyles.button}
        variant={buttonDisabled ? "disabled" : "outline"}
        disabled={buttonDisabled}
      />
      <CustomButton
        title={secondaryTitle}
        onPress={onSecondaryPress}
        variant={secondaryButtonDisabled ? "disabledDark" : "secondary"}
        overrideStyle={themedStyles.button}
        disabled={secondaryButtonDisabled}
      />
    </View>
  );
};

export default ButtonsRow;
