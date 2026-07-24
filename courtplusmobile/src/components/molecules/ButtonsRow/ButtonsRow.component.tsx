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
        overrideStyle={[themedStyles.button, themedStyles.primaryButton]}
        variant="bordered"
        overrideTextStyle={themedStyles.primaryButtonText}
        disabled={buttonDisabled}
      />
      <CustomButton
        title={secondaryTitle}
        onPress={onSecondaryPress}
        variant={secondaryButtonDisabled ? "disabledDark" : "dark"}
        overrideStyle={themedStyles.button}
        disabled={secondaryButtonDisabled}
      />
    </View>
  );
};

export default ButtonsRow;
