import { StyleProp, ViewStyle } from "react-native";

export type MetricRowProps = {
  leftValue: string;
  rightValue: string;
  overrideStyle?: StyleProp<ViewStyle>;
  onLeftValuePress?: () => void;
  onRightValuePress?: () => void;
};
