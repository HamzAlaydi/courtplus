import { StyleProp, ViewStyle } from "react-native";

export type MobileControllerProps = {
  name: string;
  label: string;
  errorText?: string;
  overrideStyle?: StyleProp<ViewStyle>;
  greyBackground?: boolean;
  phoneNumber?: string;
};
