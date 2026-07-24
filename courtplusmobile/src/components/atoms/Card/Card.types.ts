import { StyleProp, ViewStyle } from "react-native";

export type CardProps = {
  children: React.ReactNode;
  overrideStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
};
