import { StyleProp, TextStyle, ViewStyle } from "react-native";

export type CustomButtonProps = {
  title: string;
  onPress: () => void;
  variant?:
    | "active"
    | "disabled"
    | "bordered"
    | "link"
    | "dark"
    | "disabledDark";
  overrideStyle?: StyleProp<ViewStyle>;
  overrideTextStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
};
