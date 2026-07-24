import { StyleProp, TextInputProps, ViewStyle } from "react-native";

export type InputProps = TextInputProps & {
  overrideStyle?: StyleProp<ViewStyle>;
  leftComponent?: React.ReactNode;
};
