import { StyleProp, ViewStyle } from "react-native";

export type CustomSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  overrideStyle?: StyleProp<ViewStyle>;
};
