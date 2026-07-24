import { StyleProp, ViewStyle } from "react-native";

export type DateOfBirthControllerProps = {
  name: string;
  label: string;
  errorText?: string;
  overrideStyle?: StyleProp<ViewStyle>;
  greyBackground?: boolean;
};
