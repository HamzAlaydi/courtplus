import { StyleProp, ViewStyle } from "react-native";

export type ResendCodeButtonProps = {
  progressTimer: number;
  onPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  isDark?: boolean;
};
