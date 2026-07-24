import { KeyboardTypeOptions, StyleProp, ViewStyle } from "react-native";

export type FloatingInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  overrideStyle?: StyleProp<ViewStyle>;
  leftComponent?: React.ReactNode;
  errorText?: string;
  autoFocus?: false;
  onFocus?: () => void;
  onBlur?: () => void;
  keyboardType?: KeyboardTypeOptions;
  showContent?: boolean;
  greyBackground?: boolean;
};

export type FloatingLabelInputRef = {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
};
