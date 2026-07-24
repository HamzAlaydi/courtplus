import { CustomButton, OTPInput } from "atoms/index";
import React, { useRef, useState } from "react";
import { View } from "react-native";
import { OtpInputRef } from "react-native-otp-entry";
import { OTPViewProps } from "./OTPView.types";
import ResendCodeButton from "molecules/ResendCodeButton/ResendCodeButton.component";
import styles from "./OTPView.styles";

const OTPView = ({
  onFilled,
  onResendCode,
  buttonTitle,
  onButtonPress,
  overrideStyle,
  countdownTimer = 0.5,
  showButton = true,
  isDark = false,
}: OTPViewProps) => {
  const ref = useRef<OtpInputRef>(null);
  const [buttonType, setButtonType] = useState<
    "bordered" | "active" | "disabled"
  >("bordered");

  const onOtpFilled = (otp: string) => {
    setButtonType("active");
    onFilled(otp);
  };

  const onOtpChange = (otp: string) => {
    if (otp.length !== 6 && buttonType !== "disabled") {
      setButtonType("disabled");
    }
  };

  return (
    <View style={overrideStyle}>
      <OTPInput
        isDark={isDark}
        onOTPChange={onOtpChange}
        ref={ref}
        onFilled={onOtpFilled}
      />
      {showButton && (
        <CustomButton
          title={buttonTitle ?? ""}
          onPress={() => onButtonPress?.()}
          variant={buttonType}
          overrideStyle={styles.button}
        />
      )}
      <ResendCodeButton
        progressTimer={countdownTimer}
        onPress={onResendCode}
        overrideStyle={styles.resendCodeButton}
        isDark={isDark}
      />
    </View>
  );
};

export default OTPView;
