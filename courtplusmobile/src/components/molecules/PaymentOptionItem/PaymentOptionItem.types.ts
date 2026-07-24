import { StyleProp, ViewStyle } from "react-native";

export type PaymentOptionItemProps = {
  isSelected: boolean;
  onPress: () => void;
  title: string;
  amount: number;
  overrideStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
};
