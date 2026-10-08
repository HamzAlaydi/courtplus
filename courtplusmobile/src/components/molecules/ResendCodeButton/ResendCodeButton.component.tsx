import React, { useEffect, useMemo, useRef, useState } from "react";
import { ResendCodeButtonProps } from "./ResendCodeButton.types";
import { convertMinutesToSeconds } from "utils";
import { CustomButton } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./ResendCodeButton.styles";
import { useTranslation } from "react-i18next";

const ResendCodeButton = ({
  progressTimer,
  onPress,
  overrideStyle,
  isDark = false,
}: ResendCodeButtonProps) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timer, setTimer] = useState(convertMinutesToSeconds(progressTimer));
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  const onResendCode = () => {
    setTimer(convertMinutesToSeconds(progressTimer));
    onPress();
  };

  const timerText = useMemo(() => {
    if (timer === 0) {
      return t("auth.resendCode");
    }
    return t("auth.resendCodeDescription", {
      timer: timer < 10 ? `0${timer}` : timer,
    });
  }, [timer]);

  const isReady = timer === 0;

  const getButtonVariant = () => {
    if (isDark) {
      return isReady ? "secondary" : "bordered";
    }
    return "bordered";
  };

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer]);

  return (
    <CustomButton
      variant={getButtonVariant()}
      size="medium"
      title={timerText}
      onPress={onResendCode}
      disabled={!isReady}
      overrideStyle={[
        !isDark && themedStyles.onInk,
        !isDark && isReady && themedStyles.onInkReady,
        overrideStyle,
      ]}
      overrideTextStyle={[
        themedStyles.text,
        !isDark && themedStyles.onInkText,
        !isDark && isReady && themedStyles.onInkReadyText,
      ]}
    />
  );
};

export default ResendCodeButton;
