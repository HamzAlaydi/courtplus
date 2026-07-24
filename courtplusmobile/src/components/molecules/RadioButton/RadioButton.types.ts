import { StyleProp, ViewStyle } from "react-native";

export type RadioButtonProps = {
  title: string;
  isSelected: boolean;
  onPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  isDark?: boolean;
};
