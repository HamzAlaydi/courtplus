import { StyleProp, ViewStyle } from "react-native";

export type ButtonsRowProps = {
  onPress: () => void;
  onSecondaryPress: () => void;
  title: string;
  secondaryTitle: string;
  overrideStyle?: StyleProp<ViewStyle>;
  buttonDisabled?: boolean;
  secondaryButtonDisabled?: boolean;
};
