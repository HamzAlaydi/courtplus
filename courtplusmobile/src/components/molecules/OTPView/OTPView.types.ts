import { StyleProp, ViewStyle } from "react-native";

export type OTPViewProps = {
  onFilled: (otp: string) => void;
  onResendCode: () => void;
  buttonTitle?: string;
  onButtonPress?: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  countdownTimer?: number;
  showButton?: boolean;
  isDark?: boolean;
};
