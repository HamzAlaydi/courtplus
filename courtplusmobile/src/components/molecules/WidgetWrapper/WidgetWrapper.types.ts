import { StyleProp, ViewStyle } from "react-native";

export type WidgetWrapperProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  overrideStyle?: StyleProp<ViewStyle>;
};
