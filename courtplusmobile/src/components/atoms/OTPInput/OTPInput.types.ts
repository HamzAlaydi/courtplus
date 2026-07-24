import { ViewStyle } from "react-native";

export type OTPInputProps = {
  onFilled: (otp: string) => void;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
  overrideStyle?: ViewStyle;
  onOTPChange?: (otp: string) => void;
  isDark?: boolean;
};
