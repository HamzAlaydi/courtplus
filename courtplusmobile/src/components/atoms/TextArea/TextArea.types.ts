import { StyleProp, TextInputProps, ViewStyle } from "react-native";

export type TextAreaProps = TextInputProps & {
  label?: string;
  overrideStyle?: StyleProp<ViewStyle>;
  overrideWrapperStyle?: StyleProp<ViewStyle>;
};
