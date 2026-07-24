import { StyleProp, ViewStyle } from "react-native";

export type GenderControllerProps = {
  name: string;
  label: string;
  errorText?: string;
  overrideStyle?: StyleProp<ViewStyle>;
  greyBackground?: boolean;
  selectedGender?: string;
};
