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

  const getButtonVariant = () => {
    if (isDark) {
      return "dark";
    } else if (timer === 0 && isDark) {
      return "disabledDark";
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
      title={timerText}
      onPress={onResendCode}
      disabled={timer !== 0}
      overrideStyle={[timer === 0 && themedStyles.button, overrideStyle]}
      overrideTextStyle={timer === 0 && themedStyles.text}
    />
  );
};

export default ResendCodeButton;
