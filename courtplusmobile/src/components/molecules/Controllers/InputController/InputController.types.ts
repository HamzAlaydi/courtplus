import { StyleProp, ViewStyle } from "react-native";

export type InputControllerProps = {
  name: string;
  label: string;
  leftComponent?: React.ReactNode;
  errorText?: string;
  overrideStyle?: StyleProp<ViewStyle>;
  greyBackground?: boolean;
};
