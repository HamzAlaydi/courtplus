import { useThemeContext } from "contexts";
import React, { forwardRef, useMemo } from "react";
import { OtpInput, OtpInputRef } from "react-native-otp-entry";
import styles from "./OTPInput.styles";
import { OTPInputProps } from "./OTPInput.types";

const OTPInput = forwardRef<OtpInputRef, OTPInputProps>(
  (
    {
      onFilled,
      autoFocus = true,
      secureTextEntry = false,
      overrideStyle,
      onOTPChange,
      isDark = false,
    },
    ref
  ) => {
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(
      () => styles(colors, isDark),
      [colors, isDark]
    );

    return (
      <OtpInput
        ref={ref}
        focusColor={isDark ? colors.INK : colors.LIME}
        numberOfDigits={6}
        autoFocus={autoFocus}
        type="numeric"
        onTextChange={onOTPChange}
        secureTextEntry={secureTextEntry}
        focusStickBlinkingDuration={500}
        theme={{
          pinCodeContainerStyle: themedStyles.container,
          focusedPinCodeContainerStyle: themedStyles.focusedContainer,
          containerStyle: overrideStyle,
          filledPinCodeContainerStyle: themedStyles.filledContainer,
          pinCodeTextStyle: themedStyles.pinCodeText,
        }}
        onFilled={onFilled}
      />
    );
  }
);

export default OTPInput;
